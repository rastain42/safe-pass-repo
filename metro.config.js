const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configuration pour mobile uniquement (iOS et Android)
config.resolver.platforms = ['ios', 'android', 'native'];

module.exports = config;
