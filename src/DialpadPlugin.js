import { FlexPlugin } from '@twilio/flex-plugin';
import { withTheme } from '@twilio/flex-ui';
import { StylesProvider, createGenerateClassName, MuiThemeProvider, createTheme } from '@material-ui/core/styles';
import { CustomizationProvider } from "@twilio-paste/core/customization";

import registerCustomActions from './customActions';
import registerCustomNotifications from './notifications';
import { loadExternalTransferInterface } from './components/ExternalTransfer';
import { loadInternalCallInterface } from './components/InternalCall';

const PLUGIN_NAME = 'DialpadPlugin';

export default class DialpadPlugin extends FlexPlugin {
  constructor() {
    super(PLUGIN_NAME);
  }

  init(flex, manager) {
    
    const FlexThemeProvider = withTheme(({ theme, children }) => {
      return (
            <MuiThemeProvider theme={createTheme(theme)}>
                <StylesProvider generateClassName={createGenerateClassName({
                    productionPrefix: PLUGIN_NAME,
                  })}>
                    {children}
                </StylesProvider>
            </MuiThemeProvider>
      )
    });
    
    flex.setProviders({
        CustomProvider: (RootComponent) => (props) => {
            return (
                <FlexThemeProvider>
                    <RootComponent {...props} />
                </FlexThemeProvider>
            );
        },
        PasteThemeProvider: CustomizationProvider,
    });

    loadExternalTransferInterface.bind(this)(flex, manager)

    loadInternalCallInterface.bind(this)(flex, manager)

    registerCustomActions(manager);
    registerCustomNotifications(flex, manager);
  }
}
