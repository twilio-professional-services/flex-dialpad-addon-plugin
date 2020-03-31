import ConferenceService from '../../helpers/ConferenceService';

export const kickExternalTransferParticipant = (payload) => {
    const { task, targetSid } = payload;

    const conference = task.attributes.conference.sid;
    const participantSid = targetSid;

    console.log(`Removing participant ${participantSid} from conference`);
    return ConferenceService.removeParticipant(conference, participantSid);
}