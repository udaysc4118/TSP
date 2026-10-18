const path = require('path');
const backend = require(path.join(__dirname, '..', 'Sem Project', 'FRONTEND', 'backend', 'server.js'));

const app = backend.app || backend;

module.exports = app;
