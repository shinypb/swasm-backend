-- 
-- Editor SQL for DB table swasm_jobs
-- Created by http://editor.datatables.net/generator
-- 

CREATE TABLE IF NOT EXISTS swasm_jobs (
	id serial,
	payload bytea,
	code bytea,
	result bytea,
	start_ts integer,
	end_ts integer,
	PRIMARY KEY( id )
);
