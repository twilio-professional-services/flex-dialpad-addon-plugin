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
      participants = []
    } = conference;
    const liveParticipants = participants.filter(p => p.status === 'joined');

    if (liveParticipantCount > 2 && this.state.liveParticipantCount <= 2) {
      if (this.shouldUpdateParticipants(participants)) {
        this.handleMoreThanTwoParticipants(conferenceSid, liveParticipants);
      }
    } else if (liveParticipantCount <= 2 && this.state.liveParticipantCount > 2) {
      if (this.shouldUpdateParticipants(participants)) {
        this.handleOnlyTwoParticipants(conferenceSid, liveParticipants);
      }
    }

    if (liveParticipantCount !== this.state.liveParticipantCount) {
      this.setState({ liveParticipantCount });
    }
  }

  hasSingleJoinedWorkerParticipant = (participants = []) => {
    const joinedWorkers = participants.filter(p => p.participantType === 'worker' && p.status === 'joined');
    return joinedWorkers.length === 1;
  }

  hasUnknownParticipant = (participants = []) => {
    return participants.some(p => p.participantType === 'unknown');
  }

  shouldUpdateParticipants = (participants) => {
    console.debug(
      'dialpad-addon, ConferenceMonitor, shouldUpdateParticipants:',
      this.hasSingleJoinedWorkerParticipant(participants) && this.hasUnknownParticipant(participants)
    );
    return this.hasSingleJoinedWorkerParticipant(participants) && this.hasUnknownParticipant(participants);
  }

  handleMoreThanTwoParticipants = (conferenceSid, participants) => {
    console.log('More than two conference participants. Setting endConferenceOnExit to false for all participants.');
    this.setEndConferenceOnExit(conferenceSid, participants, false);
  }

  handleOnlyTwoParticipants = (conferenceSid, participants) => {
    console.log('Conference participants dropped to two. Setting endConferenceOnExit to true for all participants.');
    this.setEndConferenceOnExit(conferenceSid, participants, true);
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
      console.log(`endConferenceOnExit set to ${endConferenceOnExit} for all participants`);
    } catch (error) {
      console.error(`Error setting endConferenceOnExit to ${endConferenceOnExit} for all participants\r\n`, error);
    }
  }

  render() {
    // This is a Renderless Component, only used for monitoring and taking action on conferences
    return null;
  }
}

export default ConferenceMonitor;
