import { FlexPlugin } from 'flex-plugin';

import registerCustomActions from './customActions';
import { loadExternalTransferInterface } from './components/ExternalTransfer';
import { loadInternalCallInterface } from './components/InternalCall';

const PLUGIN_NAME = 'DialpadPlugin';

export default class DialpadPlugin extends FlexPlugin {
  constructor() {
    super(PLUGIN_NAME);
  }

  init(flex, manager) {
    // register notification for disabled Flex Dialpad
    flex.Notifications.registerNotification({
      id: "dialpadNotEnabled",
      content: "Please enable the Flex Dialpad within the Twilio Console to use the Flex Dialpad Addon Plugin",
      type: flex.NotificationType.error,
      closeButton: true,
      timeout: 0
    })

    try {
      const { enabled } = manager.serviceConfiguration.outbound_call_flows.default;

      // Check that Flex Dialpad is enabled before loading plugin features
      if (enabled) {
        loadInternalCallInterface.bind(this)(flex, manager)
        loadExternalTransferInterface.bind(this)(flex, manager)
        registerCustomActions(manager);
      }
    } catch (error) {
      console.log('Dialpad Addon Plugin:: Flex Dialpad not Enabled')
      flex.Notifications.showNotification('dialpadNotEnabled')
    }

  }
}
