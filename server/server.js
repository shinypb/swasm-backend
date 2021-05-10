const express = require("express");
require('express-async-errors');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });
const path = require("path");
const getDatabaseConnection = require("./lib/db");

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 8000;

app.use(express.static("dist"));	// parcel artifacts
app.use(express.static("public"));	// static files checked into git
app.get("/", (req, res) => res.sendFile("../dist/index.html"));

// Test endpoint
app.get("/hello", (req, res) => res.send("hi"));

// Version info endpoint
app.get("/version", (req, res) => {
	res.header("Content-Type", "text/plain");
	if (process.env.NODE_ENV === "development") return res.send("dev");
	res.sendFile(path.resolve(__dirname, "../version.txt"));
});

// Database status endpoint
app.get("/db", async (req, res) => {
	res.header("Content-Type", "application/json");

	try {
		const db = await getDatabaseConnection();
		const resp = await db.query("select now()");
		res.send(JSON.stringify({ ok: true, resp }, null, "\t"));
	} catch {
		res.send(JSON.stringify({ ok: false }));
	}
});

const jobsCreateFields = upload.fields([
	{
		name: 'payload',
		maxCount: 1,
	},
	{
		name: 'code',
		maxCount: 1,
	},
]);
app.post("/jobs/create", jobsCreateFields, async (req, res) => {
	res.header("Content-Type", "application/json");

	console.log(req.files)
	const payload = req.files.payload[0];
	const code = req.files.code[0];
	if (!code || !payload) throw new Error("Invalid job");

	try {
		const payloadHex = payload.buffer.toString('hex');
		const codeHex = code.buffer.toString('hex');

		console.log(`Creating job with ${payload.buffer.length} bytes of payload and ${code.buffer.length} bytes of code`);

		const db = await getDatabaseConnection();
		const resp = await db.query(
			"insert into swasm_jobs (payload, code, start_ts, end_ts) values (decode($1, 'hex'), decode($2, 'hex'), 0, 0) returning id",
			[payloadHex, codeHex]);
		const jobId = resp.rows[0].id;
		res.send(JSON.stringify({ ok: true, jobId }, null, "\t"));
		console.log(`Created job #${jobId}`);
	} catch(e) {
		res.send(JSON.stringify({ ok: false, error: e.message }));
	}
});

async function getJob(jobId) {
	const db = await getDatabaseConnection();
	const resp = await db.query("select * from swasm_jobs where id = $1", [ jobId ]);
	return resp.rows[0];
}

async function claimJob() {
	// todo rewrite this to use transactions to avoid potential contention if two clients try to claim a job at the same time

	const db = await getDatabaseConnection();
	const availableResp = await db.query("select id from swasm_jobs where start_ts = 0 order by id asc limit 1");
	if (!availableResp.rows.length) return null;

	const jobId = availableResp.rows[0].id;
	const startTime = Math.floor(Date.now() / 1000);
	console.log([startTime, jobId]);
	const claimResp = await db.query("update swasm_jobs set start_ts = $1 where id = $2 and start_ts = 0", [startTime, jobId]);
	console.log(claimResp);
	if (claimResp.rowCount !== 1) return null; // this would happen if someone else claimed this job at the same moment

	return jobId;
}

app.get("/jobs/claim", async (req, res) => {
	res.header("Content-Type", "application/json");

	const jobId = await claimJob();
	if (jobId) {
		res.send(JSON.stringify({ ok: true, jobId }));
	} else {
		res.send(JSON.stringify({ ok: false, error: "no_available_jobs" }));
	}
});

app.post("/jobs/:jobId/finish", upload.single("result"), async (req, res) => {
	res.header("Content-Type", "application/json");

	const jobId = req.params.jobId;
	const resultHex = req.file.buffer.toString('hex');

	const endTime = Math.floor(Date.now() / 1000);
	const db = await getDatabaseConnection();
	const resp = await db.query(
		"update swasm_jobs set end_ts = $2, result = decode($3, 'hex') where id = $1 and end_ts = 0",
		[jobId, endTime, resultHex],
	);
	if (resp.rowCount === 1) {
		res.send(JSON.stringify({ ok: true }));
	} else {
		res.send(JSON.stringify({ ok: false, error: 'job_not_eligible_for_completion' }));
	}
});

app.get("/jobs/:jobId/code", async (req, res) => {
	const { jobId } = req.params;

	res.header("content-type", "application/wasm");
	const job = await getJob(jobId);
	res.send(job.code);
});

app.get("/jobs/:jobId/payload", async (req, res) => {
	const { jobId } = req.params;

	res.header("content-type", "application/octet-stream");
	const job = await getJob(jobId);
	res.send(job.payload);
});

app.listen(port, () => {
	console.log(`Listening at http://localhost:${port}`);
});
