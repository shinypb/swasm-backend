const express = require("express");
require('express-async-errors');
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

app.listen(port, () => {
	console.log(`Listening at http://localhost:${port}`);
});
