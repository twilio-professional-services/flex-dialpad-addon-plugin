import React from 'react';

import sharedTheme from '../../styling/theme.js';
import FormControl from '@material-ui/core/FormControl';
import Select from 'react-select';
import Button from '@material-ui/core/Button';
import { Icon } from '@twilio/flex-ui';
import { withStyles } from '@material-ui/core/styles';
import { makeInternalCall } from './index';

const styles = theme => (sharedTheme(theme));

class InternalDialpad extends React.Component {

    state = { 
        workerList: [], 
        selectedWorker: null,
        searchQuery: "" 
    };
    
    async componentDidMount() {
        this.setWorkers(this.state.searchQuery);
    }

    //Search in Sync for taskrouter workers
    setWorkers = (query) => {
        this.props.manager.insightsClient.instantQuery('tr-worker').then((q) => {
            
            q.on('searchResult', (items) => {
                if(Object.keys(items).length === 0) {
                    return;
                }
                this.setState({ workerList: Object.keys(items).map(workerSid => items[workerSid]) });
            });

            q.search(query);
        });
    }

    handleChange = event => {
        this.setState({ selectedWorker: event.value })
    }

    handleInputChange = event => {
        if(event.length > 0){ 
            this.setWorkers(`data.attributes.full_name CONTAINS "${event}"`)
        }  
    }

    makeCall = () => {

        if(this.state.selectedWorker != null) {
            
            const { manager } = this.props;

            makeInternalCall({ 
                manager, 
                selectedWorker: this.state.selectedWorker, 
                workerList: this.state.workerList 
            });

        }

    }

    render() {       

        const { classes, manager } = this.props;

        const { contact_uri: worker_contact_uri }  = 
            manager.workerClient.attributes;

        const workers = this.state.workerList.map((worker)=> {
                const { activity_name } = worker;
                const { contact_uri, full_name } = worker.attributes;

                return (
                    contact_uri !== worker_contact_uri && 
                    activity_name !== "Offline" 
                ) ? (
                    { label: full_name, value: contact_uri }
                ) : null
            }
        ).filter(elem => elem);

        return (
            <div className={classes.boxDialpad}>
                <div className={classes.titleAgentDialpad}>Call Agent</div>
                <div className={classes.subtitleDialpad}>Select agent</div>
                <FormControl className={classes.formControl}>
                    <Select 
                        className="basic-single"
                        classNamePrefix="select"
                        isSearchable={true}
                        name="workers"
                        maxMenuHeight={150}
                        onChange={this.handleChange}
                        onInputChange={this.handleInputChange}
                        options={workers}
                    />
                    <div className={classes.buttonAgentDialpad}>
                        <Button 
                            variant="contained" 
                            color="primary" 
                            disabled={!this.state.selectedWorker} 
                            onClick={this.makeCall}
                            className={classes.dialPadBtn}
                        >
                            <Icon icon="Call"/>
                        </Button>
                    </div>
                </FormControl>
            </div>
        )
    }
}

export default withStyles(styles)(InternalDialpad);