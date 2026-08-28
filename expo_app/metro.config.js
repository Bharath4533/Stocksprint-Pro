const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Optimize file watcher on macOS when watchman is not present
config.watchFolders = [__dirname];

// Block watching parent directories and root node_modules
config.resolver.blockList = [
  /.*\/node_modules\/.*\/node_modules\/.*/,
  /\.git\/.*/,
];

module.exports = config;
