import React from "react";
import InternalDialpad from './InternalDialpad';
import { env } from '../../DialpadPlugin';

export const loadInternalCallInterface = (flex, manager) => {
    flex.OutboundDialerPanel.Content.add(<InternalDialpad key="select-dialpad" flex={flex} manager={manager} />)
}

export const makeInternalCall = ({ 
    manager, selectedWorker, workerList
}) => {
    const { 
        workflowSid, 
        taskQueueSid, 
        taskChannelSid,
        serviceBaseUrl 
    } = env;

    const worker_contact_uri = 
        `client:${manager.user.identity}`;

    manager.workerClient.createTask(
        selectedWorker, 
        worker_contact_uri, 
        workflowSid, 
        taskQueueSid,
        {
            attributes: { 
                to: selectedWorker,
                direction: 'outbound',
                name: workerList.find(worker => 
                    worker.attributes.contact_uri === selectedWorker).friendly_name,
                from: worker_contact_uri,
                url: serviceBaseUrl,
                targetWorker: worker_contact_uri,
                autoAnswer: 'true',
                client_call: true
            },
            taskChannelSid
        }
    );
}