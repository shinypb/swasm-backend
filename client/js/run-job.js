export default function runJob(job) {
	return new Promise((resolve, reject) => {
		const MAX_RUNTIME_MS = 5000*100;
		console.log("[SCHEDULER] Creating new runner");
		const runner = new Worker("/runner.js", {
			type: "module",
			credentials: "omit",
			name: `runner${job.jobId}`,
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

			const result = e.data.result;
			let resultReadable = e.data.result.join(',');
			try {
				const decoder = new TextDecoder();
				resultReadable = decoder.decode(result); // first, try to decode it as a string
				resultReadable = JSON.parse(resultReadable); // if that worked, try to decode it as JSON
			} catch {
				// shrug
			}

			console.log("[SCHEDULER] Worker completed successfully:", resultReadable);
			resolve(result);
			stopRunner();
		};
		runner.onerror = (e) => {
			console.error("[SCHEDULER] Runner encountered an error", e.error || e);
			stopRunner();
			reject(e.error);
		};
		jobTimeout = setTimeout(() => {
			console.error("[SCHEDULER] Runner took too long");
			stopRunner();
		}, MAX_RUNTIME_MS);

		jobStartTime = performance.now();
		console.log("[SCHEDULER] Sending job to runner", job);
		runner.postMessage(job);
	});
}
