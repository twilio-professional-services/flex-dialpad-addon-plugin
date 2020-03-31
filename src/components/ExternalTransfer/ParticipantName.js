import * as React from 'react';
import { connect } from 'react-redux';
import styled from '@emotion/styled';
import { Manager, withTheme } from '@twilio/flex-ui';
import { request } from '../../helpers/request';

const Name = styled('div')`
  font-size: 14px;
  font-weight: bold;
  margin-top: 10px;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const NameListItem = styled('div')`
  font-size: 12px;
  font-weight: bold;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
`;

class ParticipantName extends React.Component {
  state = {
    name: ''
  };

  componentDidMount() {
    const { participant, task } = this.props;
    const { callSid } = participant;

    if (participant.participantType === 'customer') {
      this.setState({ name: task.attributes.name });
      return;
    }

    const manager = Manager.getInstance();

    request("external-transfer/get-call-properties", manager, {
      callSid
    }).then(response => {
      if (response) {
        const name = (response && response.to) || '';
        this.setState({ name });
      }
    })

  }

  render() {
    return this.props.listMode
      ? (
        <NameListItem className="ParticipantCanvas-Name">
          {this.state.name}
        </NameListItem>
      ) : (
        <Name className="ParticipantCanvas-Name">
          {this.state.name}
        </Name>
      );
  }
}

const mapStateToProps = state => {
  const { serviceBaseUrl } = state.flex.config;

  return {
    serviceBaseUrl,
  };
};

export default connect(mapStateToProps)(withTheme(ParticipantName));
