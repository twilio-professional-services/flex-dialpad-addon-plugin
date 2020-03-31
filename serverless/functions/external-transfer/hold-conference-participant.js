const TokenValidator = require('twilio-flex-token-validator').functionValidator;

let path = Runtime.getFunctions()['dialpad-utils'].path;
let assets = require(path);

exports.handler = TokenValidator(async (context, event, callback) => {
  const {
    conference,
    participant,
    hold
  } = event;

  console.log(`${hold ? 'Holding' : 'Unholding'} participant ${participant} `
    + `in conference ${conference}`);

  const client = context.getTwilioClient();

  const participantsResponse = await client.conferences(conference)
    .participants(participant)
    .update({
      hold,
    });

  console.log(`Participant ${participant} updated in conference \
  ${conference}. Participant response properties:`);

  Object.keys(response.body).forEach(key => {
    console.log(`  ${key}:`, response.body[key]);
  });

  callback(null, assets.response("json", participantsResponse));
});