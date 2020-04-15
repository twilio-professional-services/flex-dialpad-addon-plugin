// your account sid
var accountSid = 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxx';

// set to /plugins.json for local dev
// set to /plugins.local.build.json for testing your build
// set to "" for the default live plugin loader
var pluginServiceUrl = '/plugins.json';

var appConfig = {
  attributes: {
    serviceBaseUrl: "",
    taskChannelSid: ""
  },
  pluginService: {
    enabled: true,
    url: pluginServiceUrl,
  },
  sso: {
    accountSid: accountSid
  },
  logLevel: 'debug',
};
