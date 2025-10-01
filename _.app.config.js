const config = require('./app.json');

module.exports = {
  expo: {
    ...config.expo,
    android: {
      ...config.expo.android,
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON,
    },
  },
};
