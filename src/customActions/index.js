import { Actions } from '@twilio/flex-ui';
import { acceptInternalTask, rejectInternalTask, isInternalCall, toggleHoldInternalCall } from './internalCall';
import { kickExternalTransferParticipant } from './externalTransfer';

export default (manager) => {

  Actions.addListener('beforeAcceptTask', (payload, abortFunction) => {

      const reservation = payload.task.sourceObject;

      if(isInternalCall(payload)){
        
        abortFunction();

        acceptInternalTask({ reservation, manager, payload });
        
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