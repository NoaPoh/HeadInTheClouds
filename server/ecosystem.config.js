module.exports.apps = [
  {
    name: 'brook',
    script: './dist/main.js',
    env_production: {
      NODE_ENV: 'production',
    },
  },
];
