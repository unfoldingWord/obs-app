const config = require('./app.json');

// Debug logging for Google Services file
console.log('🔍 GOOGLE_SERVICES_JSON env var:', process.env.GOOGLE_SERVICES_JSON ? 'EXISTS' : 'NOT_SET');
if (process.env.GOOGLE_SERVICES_JSON) {
  console.log('📄 Google Services file path:', process.env.GOOGLE_SERVICES_JSON);
}

module.exports = {
  ...config.expo,
  android: {
    ...config.expo.android,
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON || './google-services.json',
  },
};
