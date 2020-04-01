import React from 'react';

import sharedTheme from '../../styling/theme.js';
import FormControl from '@material-ui/core/FormControl';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
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
                this.setState({ workerList: Object.keys(items).map(workerSid => items[workerSid]) });
            });

            q.search(query);
        });
    }

    handleChange = event => {
        this.setState({ selectedWorker: event.target.value})
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

        const worker_contact_uri = 
        `client:${manager.user.identity}`;

        return (
            <div className={classes.boxDialpad}>
                <div className={classes.titleAgentDialpad}>Call Agent</div>
                <div className={classes.subtitleDialpad}>Select agent</div>
                <FormControl className={classes.formControl}>
                    <Select
                        value={this.state.selectedWorker}
                        onChange={this.handleChange}
                        isClearable
                    >
                        {this.state.workerList.map((worker)=> {
                                const { contact_uri, full_name } = worker.attributes;

                                return contact_uri !== worker_contact_uri ? (
                                    <MenuItem value={contact_uri} key={contact_uri}>
                                        {full_name}
                                    </MenuItem>
                                ) : null
                            }
                        )}
                    </Select>
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