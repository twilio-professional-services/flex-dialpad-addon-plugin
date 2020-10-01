import { request } from '../../helpers/request';

export const listWorkersByQueue = async (manager, taskQueueSid) => {
  try {
    const results = await request(
      'internal-call/list-workers-by-queue',
      manager,
      {
        taskQueueSid,
      }
    );
    return results;
  } catch (error) {
    console.error('Error: Unable to retrieve workers by queue', error);
  }
};
