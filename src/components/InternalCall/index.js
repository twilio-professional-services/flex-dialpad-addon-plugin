import React from "react";
import InternalDialpad from './InternalDialpad';

export const loadInternalCallInterface = (flex, manager) => {
    flex.OutboundDialerPanel.Content.add(<InternalDialpad key="select-dialpad" flex={flex} manager={manager} />)
}

export const makeInternalCall = ({ 
    manager, selectedWorker, workerList
}) => {
    const { 
        workflow_sid, 
        queue_sid
    } = manager.serviceConfiguration.outbound_call_flows.default;

    const taskChannelSid = 
        manager.configuration.attributes.taskChannelSid || 
        manager.serviceConfiguration.attributes.taskChannelSid;

    const worker_contact_uri = 
        `client:${manager.user.identity}`;

    manager.workerClient.createTask(
        selectedWorker, 
        worker_contact_uri, 
        workflow_sid, 
        queue_sid,
        {
            attributes: { 
                to: selectedWorker,
                direction: 'outbound',
                name: workerList.find(worker => 
                    worker.attributes.contact_uri === selectedWorker).friendly_name,
                from: worker_contact_uri,
                targetWorker: worker_contact_uri,
                autoAnswer: 'true',
                client_call: true
            },
            taskChannelSid
        }
    );
}