const db = require("./db");

class Config {
	#project;
	#owner;

	constructor(project, owner) {
		this.#project = project;
		this.#owner = owner;
	}

	async get(key) {
		return new Promise((resolve, reject) => {
			db().query("select value from shinypb.conf where project = ? and owner = ? limit 1", (err, rows, fields) => {
				if (err) return reject(err);;
				return resolve(rows.value);
			});
		};
	}

	async set(key, value) {}

	async delete(key) {}

	async getAll() {}

	async deleteAll() {}
}

module.exports = Config;
