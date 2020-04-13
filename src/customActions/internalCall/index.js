import { request } from '../../helpers/request';
import { env } from '../../DialpadPlugin';

export const isInternalCall = payload => 
    payload.task.attributes.client_call === true


export const acceptInternalTask = ({ 
  reservation, manager, payload 
}) => {

    if (typeof(reservation.task.attributes.conference) !== 'undefined') {

        reservation.call(reservation.task.attributes.from,
          `${env.serviceBaseUrl}/internal-call/agent-join-conference?conferenceName=${reservation.task.attributes.conference.friendlyName}`, {
            accept: true
          }
        )

    } else { 

        reservation.call(
            reservation.task.attributes.from,
            `${env.serviceBaseUrl}/internal-call/agent-outbound-join?taskSid=${payload.task.taskSid}`, 
            {
            accept: true
            }
        )

    }

}

export const rejectInternalTask = async ({ 
  manager, payload, resolve, reject 
}) => {
    
    await payload.task._reservation.accept();
    await payload.task.wrapUp();
    await payload.task.complete();
 
    const taskSid = payload.task.attributes.conferenceSid;
    
    request('internal-call/cleanup-rejected-task', manager, {
      taskSid
    }).then(response => {
      
      console.log('Outbound call has been placed into wrapping');
      resolve(response);

    })
    .catch(error => {

      console.log(error);
      reject(error);

    });

}


export const toggleHoldInternalCall = ({ 
  payload, original, task, manager, hold, resolve, reject
}) => {

  const conference = task.attributes.conference ? 
  task.attributes.conference.sid : task.attributes.conferenceSid;

  const participant = task.attributes.conference.participants ?
    task.attributes.conference.participants.worker : task.attributes.worker_call_sid;

  return request('internal-call/hold-call', manager, {
    conference,
    participant,
    hold
  }).then(response => {
    
    original(payload);
    resolve(response);

  })
  .catch(error => {

    console.log(error);
    reject(error);
    
  });

}