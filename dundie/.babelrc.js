module.exports = api => {
  api.cache(true);
  
  return {
    presets: [
      ['@babel/preset-env', {
        targets: "defaults",
        modules: false
      }]
    ],
    plugins: [],
    parserOpts: {
      sourceType: 'module'
    }
  };
}; 