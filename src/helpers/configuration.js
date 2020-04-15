export const getAttributes = manager => {
    return manager.configuration.attributes || manager.serviceConfiguration.attributes; 
}