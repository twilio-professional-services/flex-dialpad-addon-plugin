const TokenValidator = require("twilio-flex-token-validator").functionValidator;

let path = Runtime.getFunctions()['dialpad-utils'].path;
let assets = require(path);

/**
 * This function is invoked from the Flex Plugin to poll the participant
 * when awaiting Flex native updates to endConferenceOnExit. UGLY.
 * TODO: Once participant-modify event is working (support ticket open), remove 
 * this polling and use status callback event handler :)
 *
 */
exports.handler = TokenValidator(async function (context, event, callback) {
  const client = context.getTwilioClient();

  const { conferenceSid, participantCallSid } = event;

  console.debug(
    `Fetching participant ${participantCallSid} for conference ${conferenceSid}`
  );
  const participant = await client
  .conferences(conferenceSid)
  .participants(participantCallSid)
  .fetch();

  callback(null, assets.response("json", participant));
});
