CREATE TABLE shinypbdb_migrations (
	version INT UNIQUE,
	migration_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (version)
);
