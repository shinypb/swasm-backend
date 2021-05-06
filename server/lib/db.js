const { Client } = require('pg');

const connections = new Map();

module.exports = async function getDatabaseConnection(args) {
	const key = JSON.stringify(args);
	if (connections.has(key)) return connections.get(key);

	const connection = new Client({
		connectionString: process.env.DATABASE_URL,
		ssl: {
		  rejectUnauthorized: false
		}
	});
	await connection.connect();
	// connection.on("error", (err) => {
	// 	console.log(`Connection error: ${err}`);
	// 	connections.delete(key);
	// });
	connections.set(key, connection);

	return connection;
};
