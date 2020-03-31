import { Actions } from '@twilio/flex-ui';
import { acceptInternalTask, rejectInternalTask, isInternalCall, toggleHoldInternalCall } from './internalCall';
import { kickExternalTransferParticipant } from './externalTransfer';

export default (manager) => {

  Actions.replaceAction('AcceptTask', (payload, original) => {
    return new Promise((resolve, reject) => {

      const reservation = payload.task.sourceObject;

      if(isInternalCall(payload)){

        acceptInternalTask({ reservation, manager, payload });

      } else {
        
        original(payload);
      
      }

      resolve();

    });

  })

  Actions.replaceAction('RejectTask', (payload, original) => {
    return new Promise((resolve, reject) => {

      if (isInternalCall(payload)) {

        rejectInternalTask({ manager, payload, resolve, reject });
  
      } else {

        original(payload);
        resolve();

      }

    })
  })

  Actions.replaceAction('HoldCall', (payload, original) => {
    return new Promise((resolve, reject) => {
      
      const task = payload.task;

      if (isInternalCall(payload)) {
        
        toggleHoldInternalCall({ 
          payload, original, task, manager, hold: true, resolve, reject 
        });
        
      } else {
        
        original(payload)
        resolve();
       
      }

    })
  })

  Actions.replaceAction('UnholdCall', (payload, original) => {
    return new Promise((resolve, reject) => {

      const task = payload.task;

      if (isInternalCall(payload)) {
        
        toggleHoldInternalCall({ 
          payload, original, task, manager, hold: false, resolve, reject 
        });
        
      } else {
        
        original(payload)
        resolve();
        
      }
    })
  })

	Actions.replaceAction('KickParticipant', (payload, original) => {
      return new Promise((resolve, reject) => {

        const { participantType } = payload;
        
        if (
          participantType === "transfer" || 
          participantType === 'worker'
        ) {
            
          original(payload);
          resolve();

        } else  {

          kickExternalTransferParticipant(payload);
          resolve();

        }
      
    })
  });

}