import React from 'react';

import sharedTheme from '../../styling/theme.js';
import { FormControl, Button, Tabs, Tab, Box } from '@material-ui/core';
import Select from 'react-select';
import { Icon } from '@twilio/flex-ui';
import { withStyles } from '@material-ui/core/styles';
import { makeInternalCall } from './index';
import { listWorkersByQueue } from './QueueQuery';

const styles = theme => sharedTheme(theme);

class InternalDialpad extends React.Component {
  state = {
    workerList: [],
    taskQueueList: [],
    selectedWorker: null,
    selectedTaskQueue: null,
    workerSearchQuery: '',
    queueSearchQuery: '',
    selectedTab: 0,
  };

  async componentDidMount() {
    this.setWorkers(this.state.workerSearchQuery);
    this.setTaskQueues(this.state.queueSearchQuery);
  }

  //Search in Sync for taskrouter workers
  setWorkers = query => {
    this.props.manager.insightsClient.instantQuery('tr-worker').then(q => {
      q.on('searchResult', items => {
        this.setState({
          workerList: Object.keys(items).map(workerSid => items[workerSid]),
        });
      });

      q.search(query);
    });
  };

  setTaskQueues = query => {
    this.props.manager.insightsClient.instantQuery('tr-queue').then(q => {
      q.on('searchResult', items => {
        this.setState({
          taskQueueList: Object.keys(items).map(queueSid => items[queueSid]),
        });
      });

      q.search(query);
    });
  };

  handleChange = event => {
    this.setState({ selectedWorker: event.value });
  };

  handleTabChange = (event, value) => {
    this.setState({ selectedTab: value });
    this.setState({ selectedTaskQueue: null });
  };

  handleQueueChange = async event => {
    this.setState({ selectedTaskQueue: event.value });
    const workers = await listWorkersByQueue(this.props.manager, event.value);
    this.setState({
      workerList: Object.keys(workers).map(worker_sid => workers[worker_sid]),
    });
    // console.debug('🐙🐙🐙🐙', queueList);
  };

  makeCall = () => {
    if (this.state.selectedWorker != null) {
      const { manager } = this.props;

      makeInternalCall({
        manager,
        selectedWorker: this.state.selectedWorker,
        workerList: this.state.workerList,
      });
    }
  };

  TabPanel = props => {
    const { children, value, index, ...other } = props;
    return (
      <div
        role='tabpanel'
        hidden={value !== index}
        id={`simple-tabpanel-${index}`}
        aria-labelledby={`simple-tab-${index}`}
        {...other}
      >
        {value === index && <Box p={2}>{children}</Box>}
      </div>
    );
  };

  a11yProps = index => {
    return {
      id: `simple-tab-${index}`,
      'aria-controls': `simple-tabpanel-${index}`,
    };
  };

  render() {
    console.debug('🐼🐼🐼🐼', this.state.taskQueueList);
    console.debug('🍕🍕🍕🍕', this.state.workerList);
    const { classes, manager } = this.props;
    const TabPanel = this.TabPanel;
    const selectedTab = this.state.selectedTab;
    const { contact_uri: worker_contact_uri } = manager.workerClient.attributes;

    const queues = this.state.taskQueueList
      .map(queue => {
        const { queue_name, queue_sid } = queue;

        return { label: queue_name, value: queue_sid };
      })
      .filter(elem => elem);

    const workers = this.state.workerList
      .map(worker => {
        const { activity_name } = worker;
        const { contact_uri, full_name } = worker.attributes;

        return contact_uri !== worker_contact_uri && activity_name !== 'Offline'
          ? { label: full_name, value: contact_uri }
          : null;
      })
      .filter(elem => elem);

    // Sort workers alphabetically by first name
    workers.sort((a, b) => (a.full_name > b.full_name ? 1 : -1));

    return (
      <div className={classes.boxDialpad}>
        <div className={classes.titleAgentDialpad}>Call Agent</div>
        <Tabs
          value={selectedTab}
          onChange={this.handleTabChange}
          aria-label='simple tabs'
        >
          <Tab label='Agent' {...this.a11yProps(0)} />
          <Tab label='Queue' {...this.a11yProps(1)} />
        </Tabs>
        <TabPanel value={selectedTab} index={0}>
          <FormControl className={classes.formControl}>
            <Select
              className='basic-single'
              classNamePrefix='select'
              isSearchable={true}
              name='workers'
              maxMenuHeight={150}
              onChange={this.handleChange}
              options={workers}
              placeholder='Select an Agent'
            />
            {this.state.selectedWorker && (
              <div className={classes.buttonAgentDialpad}>
                <Button
                  variant='contained'
                  color='primary'
                  disabled={!this.state.selectedWorker}
                  onClick={this.makeCall}
                  className={classes.dialPadBtn}
                >
                  <Icon icon='Call' />
                </Button>
              </div>
            )}
          </FormControl>
        </TabPanel>
        <TabPanel value={selectedTab} index={1}>
          <FormControl className={classes.formControl}>
            <Select
              className='basic-single'
              classNamePrefix='select'
              isSearchable={true}
              name='queues'
              maxMenuHeight={150}
              onChange={this.handleQueueChange}
              options={queues}
              placeholder='Select a Queue'
            />

            {this.state.selectedTaskQueue && (
              <React.Fragment>
                <Select
                  className='basic-single'
                  classNamePrefix='select'
                  isSearchable={true}
                  name='workers'
                  maxMenuHeight={150}
                  onChange={this.handleChange}
                  options={workers}
                />
                {this.state.selectedWorker && (
                  <div className={classes.buttonAgentDialpad}>
                    <Button
                      variant='contained'
                      color='primary'
                      disabled={!this.state.selectedWorker}
                      onClick={this.makeCall}
                      className={classes.dialPadBtn}
                    >
                      <Icon icon='Call' />
                    </Button>
                  </div>
                )}
              </React.Fragment>
            )}
          </FormControl>
        </TabPanel>
      </div>
    );
  }
}

export default withStyles(styles)(InternalDialpad);
