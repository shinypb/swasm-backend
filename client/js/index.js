import runJob from "./run-job";

async function claimJob() {
	const override = parseInt(location.hash.replace(/^#/, ''), 10);
	if (isFinite(override) && override > 0) return override;

	const resp = await fetch("/jobs/claim").then(response => response.json())
	if (resp.ok) return resp.jobId;
	if (resp.error == "no_available_jobs") return null;
	throw new Error(resp.error);
}

(async () => {
	window.onhashchange = () => location.reload();

	const jobId = await claimJob();
	if (!jobId) {
		console.error("[SCHEDULER] No jobs available");
		return;
	}

	console.log("[SCHEDULER] Claimed job", jobId);

	const result = runJob({
		jobId,
		codeUrl: `/jobs/${jobId}/code`,
		payloadUrl: `jobs/${jobId}/payload`,
	});
})();
