import React from 'react';
import InternalDialpad from './InternalDialpad';

export const loadInternalCallInterface = (flex, manager) => {
  flex.OutboundDialerPanel.Content.add(
    <InternalDialpad key='select-dialpad' flex={flex} manager={manager} />
  );
};

export const makeInternalCall = ({ manager, selectedWorker, workerList }) => {
  const {
    workflow_sid,
    queue_sid,
  } = manager.serviceConfiguration.outbound_call_flows.default;

  const { REACT_APP_TASK_CHANNEL_SID: taskChannel } = process.env;

  const { contact_uri } = manager.workerClient.attributes;

  manager.workerClient.createTask(
    selectedWorker,
    contact_uri,
    workflow_sid,
    queue_sid,
    {
      attributes: {
        to: selectedWorker,
        direction: 'outbound',
        name: workerList.find(
          worker => worker.attributes.contact_uri === selectedWorker
        ).friendly_name,
        from: contact_uri,
        targetWorker: contact_uri,
        autoAnswer: 'true',
        client_call: true,
      },
      taskChannel,
    }
  );
};
