module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // Reanimated must be LAST in the plugin list
    'react-native-reanimated/plugin',
  ],
};
