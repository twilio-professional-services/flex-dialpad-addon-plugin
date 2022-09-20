import InternalCallService from '../../services/InternalCallService';

export const isInternalCall = payload => 
    payload.task.attributes.client_call === true


export const beforeAcceptTask = async (payload, abortFunction) => {
  if (!isInternalCall(payload)) {
    return false;
  }
  
  abortFunction();
  await InternalCallService.acceptInternalTask(payload.task.sourceObject, payload.task.taskSid);
  return true;
}

export const beforeRejectTask = async (payload, abortFunction) => {
  if (!isInternalCall(payload)) {
    return false;
  }
  
  abortFunction();
  await InternalCallService.rejectInternalTask(payload.task);
  return true;
}

export const beforeHoldCall = async (payload) => {
  if (!isInternalCall(payload)) {
    return false;
  }
  
  await InternalCallService.toggleHoldInternalCall(payload.task, true);
  return true;
}

export const beforeUnholdCall = async (payload) => {
  if (!isInternalCall(payload)) {
    return false;
  }
  
  await InternalCallService.toggleHoldInternalCall(payload.task, false);
  return true;
}