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
      console.debug(
        `dialpad-addon, ConferenceMonitor, componentDidUpdate, increased from ${this.state.liveParticipantCount} to ${liveParticipantCount}`);
      console.debug(
        `dialpad-addon, ConferenceMonitor, componentDidUpdate, liveWorkerCount: ${liveWorkerCount} liveParticipantCount: ${liveParticipantCount}`);
      if (this.shouldUpdateParticipants(participants, liveWorkerCount)) {
        this.handleMoreThanTwoParticipants(conferenceSid, liveParticipants);
      }
    } else if (liveParticipantCount <= 2 && this.state.liveParticipantCount > 2) {  
      console.debug(
        `dialpad-addon, ConferenceMonitor, componentDidUpdate, decreased from ${this.state.liveParticipantCount} to ${liveParticipantCount}`);
      console.debug(
        `dialpad-addon, ConferenceMonitor, componentDidUpdate, liveWorkerCount: ${liveWorkerCount} liveParticipantCount: ${liveParticipantCount}`);
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
    // console.debug(
    //   'dialpad-addon, ConferenceMonitor, shouldUpdateParticipants:',
    //   liveWorkerCount <= 1 && this.hasUnknownParticipant(participants)
    // );
    // return liveWorkerCount <= 1 && this.hasUnknownParticipant(participants);

    /*
     * COMMENTED OUT DEFAULT BEHAVIOR ABOVE WHICH ONLY LOOKS AT EXTERNAL CONFERENCES
     * For non-graceful diconnect logic, we always want worker endConferenceOnExit to be false - including on 
     * conferences involving internal agents
     */
    return true;

  }

  handleMoreThanTwoParticipants = (conferenceSid, participants) => {
    // TODO: If multiple agents are in conference, they will each execute the same updates
    console.debug('dialpad-addon, ConferenceMonitor, handleMoreThanTwoParticipants, More than two conference participants. Setting endConferenceOnExit to false for all participants.');
    this.setEndConferenceOnExit(conferenceSid, participants, false);
  }

  handleOnlyTwoParticipants = async (conferenceSid, participants) => {
    // COMMENTING OUT REGULAR IMPL
    /*
    console.log('Conference participants dropped to two. Setting endConferenceOnExit to true for all participants.');
    this.setEndConferenceOnExit(conferenceSid, participants, true);
    */
    

    /*
     *
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
      (p) => p.isMyself
    );

    const anyOtherWorkers = participants.filter(
      (p) => p.participantType === "worker" && !p.isMyself
    );
    
    // If I'm not a participant anymore (and there are no other agents involved), then perform default logic of setting all remaining participants as endConferenceOnExit true
    // NOTE: If there ARE other workers, their own Flex Plugin will deal with this logic (so need for me to do it a second time)
    if (!myParticipant) {
      console.debug('dialpad-addon, ConferenceMonitor, handleOnlyTwoParticipants, I am no longer in this conference');
      if (anyOtherWorkers.length == 0) {
        console.debug('dialpad-addon, ConferenceMonitor, handleOnlyTwoParticipants, No other workers in conference, so set endConferenceOnExit to true for all');
        this.setEndConferenceOnExit(conferenceSid, participants, true);
      }
      // Nothing more to do when I'm not a participant
      return;
    } 

    // If I'm still in conference, then only set the other NON-WORKER participants to endConferenceOnExit true. 
    // Don't update any other worker participants - because they have their own instance of this Flex Plugin that'll
    // take care of this! 
    if (anyOtherWorkers.length > 0) {
      console.debug('dialpad-addon, ConferenceMonitor, handleOnlyTwoParticipants, Just me and another worker. No need to fiddle with endConferenceOnExit (Flex sets to true)');
      return;
    }

    // Just me an some other non-worker participant. So set endConferenceOnExit to false for me - to allow non-graceful disconnect logic to 
    // engage. Set other participant to true.
    console.debug('dialpad-addon, ConferenceMonitor, handleOnlyTwoParticipants, Just me and some non-worker participant. Setting endConferenceOnExit to true for the other participant');
    this.setEndConferenceOnExit(conferenceSid, participants.filter((p) => !p.isMyself), true);
    console.debug('dialpad-addon, ConferenceMonitor, handleOnlyTwoParticipants, Waiting for Flex to do its native thing (setting endConferenceOnExit to true for my agent), so i can undo it');
    await this.waitForFlexNativeUpdate(task, myParticipant.callSid);
    console.debug('dialpad-addon, ConferenceMonitor, handleOnlyTwoParticipants, Done waiting, updating endConferenceOnExit to false for my worker participant - to allow non-graceful agent disconnect handling');
    this.setEndConferenceOnExit(conferenceSid, participants.filter((p) => p.isMyself), false);    
  }

  waitForFlexNativeUpdate = (task, participantCallSid) => {
    return new Promise(async(resolve) => {
      const waitTimeMs = 250;
  
      const maxWaitTimeMs = 5000;
      let waitForUpdateInterval = setInterval(async () => {
        const { conference } = task;
  
        if (!this.isTaskActive(task)) {
          console.debug("dialpad-addon, ConferenceMonitor, waitForFlexNativeUpdate > Call canceled, clearing waitForUpdateInterval");
          waitForUpdateInterval = clearInterval(waitForUpdateInterval);
          return;
        }
  
        // TODO: Find a better way. 
        const participantLatest = await ConferenceService.fetchParticipant(conference.conferenceSid, participantCallSid);

        if (participantLatest.endConferenceOnExit !== true) {
          console.debug("dialpad-addon, ConferenceMonitor, waitForFlexNativeUpdate > Flex has not yet updated the endConferenceOnExit flag for participant");
          return;
        }
  
        console.debug("dialpad-addon, ConferenceMonitor, waitForFlexNativeUpdate > Flex updated the endConferenceOnExit flag to true for participant");
  
        waitForUpdateInterval = clearInterval(waitForUpdateInterval);
  
        resolve(participantLatest);
      }, waitTimeMs);
  
      setTimeout(() => {
        if (waitForUpdateInterval) {
          console.debug(`dialpad-addon, ConferenceMonitor, waitForFlexNativeUpdate > endConferenceOnExit wasn't set to true within ${
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
      console.debug(`dialpad-addon, ConferenceMonitor, setEndConferenceOnExit, setting endConferenceOnExit = ${endConferenceOnExit} for callSid: ${p.callSid} status: ${p.status}`);
      if (p.connecting) { return } //skip setting end conference on connecting parties as it will fail
      promises.push(
        ConferenceService.setEndConferenceOnExit(conferenceSid, p.callSid, endConferenceOnExit)
      );
    });

    try {
      await Promise.all(promises);
      console.debug(`dialpad-addon, ConferenceMonitor, setEndConferenceOnExit, endConferenceOnExit set to ${endConferenceOnExit} for ${participants.length} participants`);
    } catch (error) {
      console.error(`dialpad-addon, ConferenceMonitor, setEndConferenceOnExit, Error setting endConferenceOnExit to ${endConferenceOnExit} for ${participants.length} participants\r\n`, error);
    }
  }

  render() {
    // This is a Renderless Component, only used for monitoring and taking action on conferences
    return null;
  }
}

export default ConferenceMonitor;
