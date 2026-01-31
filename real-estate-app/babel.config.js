module.exports = function(api) {
  api.cache(true);
  return {
    presets: [
      'babel-preset-expo',
      '@babel/preset-typescript'
    ],
    plugins: [
      // Only include reanimated plugin in non-test environments
      ...(process.env.NODE_ENV !== 'test' ? ['react-native-reanimated/plugin'] : []),
    ],
  };
};