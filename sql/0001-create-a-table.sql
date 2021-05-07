-- 
-- Editor SQL for DB table swasm_jobs
-- Created by http://editor.datatables.net/generator
-- 

CREATE TABLE IF NOT EXISTS swasm_jobs (
	id serial,
	payload bytea,
	code bytea,
	start_ts numeric(9,2),
	end_ts numeric(9,2),
	PRIMARY KEY( id )
);
