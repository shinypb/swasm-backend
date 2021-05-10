function stringToUint8Array(str) {
	const encoder = new TextEncoder();
	return encoder.encode(str);
}

async function claimJob() {
	const override = parseInt(location.hash.replace(/^#/, ''), 10);
	if (isFinite(override) && override > 0) return override;

	const resp = await fetch("/jobs/claim").then(response => response.json())
	if (resp.ok) return resp.jobId;
	if (resp.error == "no_available_jobs") return null;
	throw new Error(resp.error);
}

(async () => {
	const jobId = await claimJob();
	if (!jobId) {
		console.error("[SCHEDULER] No jobs available");
		return;
	}

	console.log("[SCHEDULER] Claimed job", jobId);

	const MAX_RUNTIME_MS = 5000*100;
	console.log("[SCHEDULER] Creating new runner");
	const runner = new Worker("/runner.js", {
		type: "module",
		credentials: "omit",
		name: `runner${jobId}`,
	});

	let jobTimeout;
	let jobStartTime;
	const stopRunner = () => {
		runner.onmessage = undefined;
		runner.onerror = undefined;
		runner.terminate();
		console.log("[SCHEDULER] Job stopped after", Math.ceil(performance.now() - jobStartTime), "ms");

		clearTimeout(jobTimeout);
		jobTimeout = undefined;
	};
	runner.onmessage = (e) => {
		if (e.data.type !== 'complete') {
			runner.onerror(e.data);
			return;
		}

		let resultReadable;
		try {
			const decoder = new TextDecoder();
			resultReadable = decoder.decode(e.data.result);
		} catch {
			resultReadable = e.data.result.join(',');
		}

		console.log("[SCHEDULER] Worker completed successfully:", resultReadable);
		stopRunner();
	};
	runner.onerror = (e) => {
		console.error("[SCHEDULER] Runner encountered an error", e.error || e);
		stopRunner();
	};
	jobTimeout = setTimeout(() => {
		console.error("[SCHEDULER] Runner took too long");
		stopRunner();
	}, MAX_RUNTIME_MS);

	jobStartTime = performance.now();
	const job = {
		codeUrl: `/jobs/${jobId}/code`,
		payloadUrl: `jobs/${jobId}/payload`,
	};
	console.log("[SCHEDULER] Sending job to runner", job);
	runner.postMessage(job);
})();
