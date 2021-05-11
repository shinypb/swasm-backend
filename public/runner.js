function log(...args) {
	console.log("[RUNNER]", ...args);
}

log("Runner started; waiting for job");

self.onmessage = async ({ data }) => {
	const DEBUG_MODE = !!data.debugMode;
	if (!data.codeUrl) throw new Error("Job is missing 'codeUrl'")
	if ((!data.payload && !data.payloadUrl) || (data.payload && data.payloadUrl)) throw new Error("Job must have either 'payload' or 'payloadUrl' but not both");
	log("Received job request");

	let instance;
	let payload;
	if (data.payloadUrl) {
		payload = await fetch(data.payloadUrl).then(response => response.arrayBuffer());
	} else {
		payload = data.payload;
	}
	const memory = new WebAssembly.Memory({ initial: 1 });

	function finish(resultPointer, resultLength) {
		const srcArray = new Uint8Array(instance.exports.memory.buffer, resultPointer, resultLength);
		const destArray = new Uint8Array(resultLength);
		destArray.set(srcArray);

		log("Job complete; result:", destArray);
		self.postMessage({ type: "complete", result: destArray });
		self.close();
	}

	let nextServiceRequestId = 1999;
	function requestService(serviceType, payloadPointer, payloadLength) {
		const serviceRequestId = nextServiceRequestId++;

		function sendResponse(buffer) {
			const srcArray = new Uint8Array(buffer);
			const destPointer = instance.exports.allocateBytes(buffer.byteLength);
			const destArray = new Uint8Array(instance.exports.memory.buffer, destPointer, srcArray.length);
			destArray.set(srcArray);
			setTimeout(() => {
				instance.exports.serviceResponse(serviceRequestId, destPointer, srcArray.length);
			}, 0);
		}

		const GET_CURRENT_TIME = 1;
		const DEBUG_LOG_MESSAGE = 4;
		switch (serviceType) {
			case GET_CURRENT_TIME: {
				const buffer = new ArrayBuffer(8);
				const view = new DataView(buffer);
				view.setBigUint64(0, BigInt(Date.now()));
				sendResponse(buffer);
				break;
			}
			case DEBUG_LOG_MESSAGE: {
				if (!DEBUG_MODE) return;

				const buffer = new ArrayBuffer(payloadLength);
				const destArray = new Uint8Array(buffer);
				const srcArray = new Uint8Array(instance.exports.memory.buffer, payloadPointer, payloadLength);
				destArray.set(srcArray);
				const decoder = new TextDecoder();
				const msg = decoder.decode(buffer);
				console.log("[JOB DEBUG]", msg);
				sendResponse(new ArrayBuffer(0));
				break;
			}
			default:
				throw new Error(`Unsupported service type ${serviceType}`);
		}

		return serviceRequestId;
	}

	const importObject = {
		env: {
			finish,
			requestService,
			abort: (_, line, col) => { throw new Error(`Abort called at ${line}:${col}`); },
			memory,
			table: new WebAssembly.Table({ initial: 0, element: 'anyfunc' })
		}
	};

	log("Fetching code", data.codeUrl);
	fetch(data.codeUrl).then(response => response.arrayBuffer()).then((bytes) =>
		WebAssembly.instantiate(bytes, importObject)
	).then((obj) => {
			instance = obj.instance;

			log("Writing payload (", payload.byteLength, "bytes )");
			const srcArray = new Uint8Array(payload);
			const destPointer = instance.exports.allocateBytes(payload.byteLength);
			const destArray = new Uint8Array(instance.exports.memory.buffer, destPointer, srcArray.length);
			destArray.set(srcArray);

			instance.exports.setPayload(destPointer, payload.byteLength);
			instance.exports.freeBytes(destPointer);
	
			log("Job is starting");
			instance.exports.main();
		}).catch((e) => {
			log("Error instantiating or running code");
			self.postMessage({ type: "error", error: e });
		});
};

