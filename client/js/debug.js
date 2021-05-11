import runJob from "./run-job";

function stringToUint8Array(str) {
	const encoder = new TextEncoder();
	return encoder.encode(str);
}

(async () => {
	const jobId = 0;
	const jobName = location.hash.replace(/^#/, '') || 'hello-world';
	const codeUrl = `/jobs/${jobName}.wasm`;
	console.log("[DEBUG] Running job", jobName);

	window.onhashchange = () => location.reload();

	if (!jobName) {
		console.error("Specify job name in hash of URL, e.g. #foo");
		return;
	}

	const PAYLOADS = {
		"hello-world": "world",
		double: JSON.stringify(42),
		not: JSON.stringify(true),
		reversestring: JSON.stringify("hot dogs"),
		sum: JSON.stringify([1, 2, 3, 4, 5]),
	};	

	const result = await runJob({
		jobId,
		codeUrl,
		payload: PAYLOADS[jobName] ? stringToUint8Array(PAYLOADS[jobName]) : new Uint8Array(0),
		debugMode: true,
	});
})();
