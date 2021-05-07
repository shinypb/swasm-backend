const express = require("express");
require('express-async-errors');
const bodyParser = require('body-parser');
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
