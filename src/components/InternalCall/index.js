import React from "react";
import InternalDialpad from './InternalDialpad';

export const loadInternalCallInterface = (flex, manager) => {
    flex.OutboundDialerPanel.Content.add(<InternalDialpad key="select-dialpad" flex={flex} manager={manager} />)
}