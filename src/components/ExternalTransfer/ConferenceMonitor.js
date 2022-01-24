import * as React from 'react';
import ConferenceService from '../../helpers/ConferenceService';

class ConferenceMonitor extends React.Component {
  state = {
    liveParticipantCount: 0
  }

  componentDidUpdate() {
    const { task } = this.props;
    const conference = task && (task.conference || {});
    const {
      conferenceSid,
      liveParticipantCount,
      liveWorkerCount,
      participants = []
    } = conference;
    const liveParticipants = participants.filter(p => p.status === 'joined');

    if (liveParticipantCount > 2 && this.state.liveParticipantCount <= 2) {
      if (this.shouldUpdateParticipants(participants, liveWorkerCount)) {
        this.handleMoreThanTwoParticipants(conferenceSid, liveParticipants);
      }
    } else if (liveParticipantCount <= 2 && this.state.liveParticipantCount > 2) {
      if (this.shouldUpdateParticipants(participants, liveWorkerCount)) {
        this.handleOnlyTwoParticipants(conferenceSid, liveParticipants);
      }
    }

    if (liveParticipantCount !== this.state.liveParticipantCount) {
      this.setState({ liveParticipantCount });
    }
  }

  hasUnknownParticipant = (participants = []) => {
    return participants.some(p => p.participantType === 'unknown');
  }

  shouldUpdateParticipants = (participants, liveWorkerCount) => {
    console.debug(
      'dialpad-addon, ConferenceMonitor, shouldUpdateParticipants:',
      liveWorkerCount <= 1 && this.hasUnknownParticipant(participants)
    );
    return liveWorkerCount <= 1 && this.hasUnknownParticipant(participants);
  }

  handleMoreThanTwoParticipants = (conferenceSid, participants) => {
    console.log('More than two conference participants. Setting endConferenceOnExit to false for all participants.');
    this.setEndConferenceOnExit(conferenceSid, participants, false);
  }

  handleOnlyTwoParticipants = async (conferenceSid, participants) => {
    // COMMENTING OUT REGULAR IMPL
    /*
    console.log('Conference participants dropped to two. Setting endConferenceOnExit to true for all participants.');
    this.setEndConferenceOnExit(conferenceSid, participants, true);
    */
    
    // REPLACING WITH NON-GRACEFUL AGENT DISCONNECT LOGIC 
    /*
     * When paired with `flex-recover-non-graceful-disconnects` plugin (and functions, handlers, etc), this logic is 
     * essential in reacting to participant count of 2 - where we want to keep agent's endConferenceOnExit flag as false.
     * In addition, Flex itself has logic that sets endConferenceOnExit to true when participant count drops to 2,
     * so we only want to apply our update once we see that Flex has done it's thing. Due to a limitation on the conference
     * events, we can't listen for this - we have to instead poll the participant via the REST API
     */
    const { task } = this.props;
    const myParticipant = participants.find(
      (p) => p.workerSid === ConferenceService.manager.workerClient.sid
    );
    if (!myParticipant) {
      // If I'm not a participant anymore, then perform default logic of setting all remaining participants as endConferenceOnExit true
      console.log('Conference participants dropped to two, but agent is no longer in conference. Setting endConferenceOnExit to true for all remaining participants.');
      this.setEndConferenceOnExit(conferenceSid, participants, true);
      return;
    } 

    // If I'm still in conference, then only set the others to endConferenceOnExit true - and make sure my flag is false!
    console.log('Conference participants dropped to two (including agent).');
    console.log('Setting endConferenceOnExit to true for remaining participants - excluding agent');
    this.setEndConferenceOnExit(conferenceSid, participants.filter((p) => p.workerSid !== myParticipant.workerSid), true);
    console.log('Waiting for Flex to do its native thing (setting endConferenceOnExit to true for agent), so i can undo it');
    await this.waitForFlexNativeUpdate(task, myParticipant.callSid);
    console.log('Done waiting, updating endConferenceOnExit to false for worker - to allow non-graceful agent disconnect handling');
    const participantsToUpdate = [];
    participantsToUpdate.push(myParticipant);
    this.setEndConferenceOnExit(conferenceSid, participantsToUpdate, false);
    // NOTE: Flex natively takes care of the other remaining participant getting set to true (TODO: Validate when other participant is non-customer)
    
  }

  waitForFlexNativeUpdate = (task, participantCallSid) => {
    return new Promise(async(resolve) => {
      const waitTimeMs = 250;
  
      const maxWaitTimeMs = 5000;
      let waitForUpdateInterval = setInterval(async () => {
        const { conference } = task;
  
        if (!this.isTaskActive(task)) {
          console.debug(
            "waitForFlexNativeUpdate > Call canceled, clearing waitForUpdateInterval"
          );
          waitForUpdateInterval = clearInterval(waitForUpdateInterval);
          return;
        }
  
        const participantLatest = await ConferenceService.fetchParticipant(conference.conferenceSid, participantCallSid);

        console.debug('participantLatest', participantLatest);

        if (participantLatest.endConferenceOnExit !== true) {
          console.debug(
            "waitForFlexNativeUpdate > Flex has not yet updated the endConferenceOnExit flag for participant"
          );
          return;
        }
  
        console.debug(
          "waitForFlexNativeUpdate > Flex updated the endConferenceOnExit flag to true for participant"
        );
  
        waitForUpdateInterval = clearInterval(waitForUpdateInterval);
  
        resolve(participantLatest);
      }, waitTimeMs);
  
      setTimeout(() => {
        if (waitForUpdateInterval) {
          console.debug(
            `waitForFlexNativeUpdate > endConferenceOnExit wasn't set to true within ${
              maxWaitTimeMs / 1000
            } seconds`
          );
          clearInterval(waitForUpdateInterval);
  
          resolve([]);
        }
      }, maxWaitTimeMs);
    });
  }

  isTaskActive = (task) => {
    const { sid: reservationSid, taskStatus } = task;
    if (taskStatus === "canceled") {
      return false;
    } else {
      return ConferenceService.manager.workerClient.reservations.has(reservationSid);
    }
  }

  setEndConferenceOnExit = async (conferenceSid, participants, endConferenceOnExit) => {
    const promises = [];
    participants.forEach(p => {
      console.log(`setting endConferenceOnExit = ${endConferenceOnExit} for callSid: ${p.callSid} status: ${p.status}`);
      if (p.connecting) { return } //skip setting end conference on connecting parties as it will fail
      promises.push(
        ConferenceService.setEndConferenceOnExit(conferenceSid, p.callSid, endConferenceOnExit)
      );
    });

    try {
      await Promise.all(promises);
      console.log(`endConferenceOnExit set to ${endConferenceOnExit} for ${participants.length} participants`);
    } catch (error) {
      console.error(`Error setting endConferenceOnExit to ${endConferenceOnExit} for ${participants.length} participants\r\n`, error);
    }
  }

  render() {
    // This is a Renderless Component, only used for monitoring and taking action on conferences
    return null;
  }
}

export default ConferenceMonitor;
