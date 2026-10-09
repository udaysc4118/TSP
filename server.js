const path = require('path');

const backend = require(path.join(__dirname, 'Sem Project', 'FRONTEND', 'backend', 'server.js'));

if (require.main === module && backend && typeof backend.startServer === 'function') {
	backend.startServer();
}

module.exports = backend;
