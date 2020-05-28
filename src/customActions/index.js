import { Actions } from '@twilio/flex-ui';
import { acceptInternalTask, rejectInternalTask, isInternalCall, toggleHoldInternalCall } from './internalCall';
import { kickExternalTransferParticipant } from './externalTransfer';
import ConferenceService from '../helpers/ConferenceService';

export default (manager) => {

  Actions.addListener('beforeAcceptTask', (payload, abortFunction) => {

      const reservation = payload.task.sourceObject;

      if(isInternalCall(payload)){
        
        abortFunction();

        acceptInternalTask({ reservation, payload });
        
      } 

  })

  Actions.addListener('beforeRejectTask', (payload, abortFunction) => {

      if (isInternalCall(payload)) {

        abortFunction();

        rejectInternalTask({ manager, payload });
  
      } 

  })

  const holdCall = (payload, hold) => {
    return new Promise((resolve, reject) => {
      
      const task = payload.task;

      if (isInternalCall(payload)) {
        
        toggleHoldInternalCall({ 
          task, manager, hold, resolve, reject 
        });
        
      } else {

        resolve();
       
      }

    })
  }

  Actions.addListener('beforeHoldCall', (payload) => {
    return holdCall(payload, true)
  })

  Actions.addListener('beforeUnholdCall', (payload) => {
    return holdCall(payload, false)
  })

  Actions.addListener('beforeHoldParticipant', (payload, abortFunction) => {
    const { participantType, targetSid: participantSid, task } = payload;

    if (participantType !== 'unknown') {
      return;
    }

    const { conferenceSid } = task.conference;
    abortFunction();
    console.log('Holding participant', participantSid);
    return ConferenceService.holdParticipant(conferenceSid, participantSid);
  });

  Actions.addListener('beforeUnholdParticipant', (payload, abortFunction) => {
    const { participantType, targetSid: participantSid, task } = payload;

    if (participantType !== 'unknown') {
      return;
    }

    const { conferenceSid } = task.conference;
    abortFunction();
    console.log('Holding participant', participantSid);
    return ConferenceService.unholdParticipant(conferenceSid, participantSid);
  });

	Actions.addListener('beforeKickParticipant', (payload, abortFunction) => {

      const { participantType } = payload;
      
      if (
        participantType !== "transfer" &&
        participantType !== 'worker'
      ) {
        
        abortFunction();

        kickExternalTransferParticipant(payload);
    
      }
    
  })

}