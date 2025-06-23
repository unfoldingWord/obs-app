const config = require('./app.json');

module.exports = {
  ...config.expo,
  android: {
    ...config.expo.android,
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON || './google-services.json',
  },
};
