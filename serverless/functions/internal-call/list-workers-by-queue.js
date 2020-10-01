const TokenValidator = require('twilio-flex-token-validator').functionValidator;

let path = Runtime.getFunctions()['dialpad-utils'].path;
let assets = require(path);

exports.handler = TokenValidator(async (context, event, callback) => {
  console.log('WORKSPACE SID: ', context.TWILIO_WORKSPACE_SID);
  console.log('CHANNEL SID: ', context.TWILIO_VOICE_CHANNEL_SID);
  const client = context.getTwilioClient();

  // 1. Retrieve list of available workers by TaskQueue
  const queueWorkers = await client.taskrouter
    .workspaces(context.TWILIO_WORKSPACE_SID)
    .workers.list({ TaskQueueSid: 'event.taskQueueSid' });

  console.log('FULL LIST: ', queueWorkers);

  const workersFiltered = queueWorkers.filter(
    worker =>
      worker.activityName === 'Available' || worker.activityName === 'Idle'
  );

  // 2. Loop through each worker to see if channel capacity is 100.
  const promises = workersFiltered.map(async worker => {
    const workerAttributes = JSON.parse(worker.attributes);
    const channels = await client.taskrouter
      .workspaces(context.TWILIO_WORKSPACE_SID)
      .workers(worker.sid)
      .workerChannels.list();
    const workerCapacity = channels.find(
      channel => channel.taskChannelUniqueName === 'voice'
    );
    if (workerCapacity.availableCapacityPercentage === 100) {
      let properties = {
        worker_sid: worker.sid,
        activity_name: worker.activityName,
        workspace_sid: worker.workspaceSid,
        worker_activity_sid: worker.activitySid,
        friendly_name: worker.friendlyName,
        attributes: {
          full_name: workerAttributes.full_name,
          contact_uri: workerAttributes.contact_uri,
        },
        date_updated: worker.dateUpdated,
        date_activity_changed: worker.dateStatusChanged,
      };
      return properties;
    }
  });

  // 3. Return promises as workers
  const workers = await Promise.all(promises);
  console.log('🍕🍕🍕🍕🍕', workers);

  callback(null, assets.response('json', workers));
});
