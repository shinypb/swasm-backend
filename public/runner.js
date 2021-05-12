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
		const EMPTY_RESPONSE = [0, 0];
		const SIZE_OF_I32 = 4;
		const SIZE_OF_I64 = 8;

		const payloadBuffer = new ArrayBuffer(payloadLength);
		const destArray = new Uint8Array(payloadBuffer);
		const srcArray = new Uint8Array(instance.exports.memory.buffer, payloadPointer, payloadLength);
		destArray.set(srcArray);

		function asyncResponse(promise) {
			promise.then((buffer) => {
				const srcArray = new Uint8Array(buffer);
				const destLength = buffer.byteLength;
				const destPointer = instance.exports.allocateBytes(destLength);
				const destArray = new Uint8Array(instance.exports.memory.buffer, destPointer, destLength);
				destArray.set(srcArray);
				instance.exports.asyncServiceResponseCallback(serviceRequestId, destPointer, destLength);
			});

			const buffer = new ArrayBuffer(SIZE_OF_I32);
			const view = new DataView(buffer);
			view.setUint32(0, serviceRequestId);
			return syncResponse(buffer);
		}

		function syncResponse(buffer) {
			const srcArray = new Uint8Array(buffer);
			const destLength = buffer.byteLength;
			const destPointer = instance.exports.allocateBytes(destLength);
			const destArray = new Uint8Array(instance.exports.memory.buffer, destPointer, destLength);
			destArray.set(srcArray);

			// then, we need to return a two item array containing destPointer and destLength
			const respArray = new Uint32Array(2);
			respArray[0] = destPointer;
			respArray[1] = destLength;

			const respDestPointer = instance.exports.allocateBytes(respArray.buffer.byteLength);
			const respDestArray = new Uint32Array(instance.exports.memory.buffer, respDestPointer, respArray.buffer.byteLength);
			respDestArray.set(respArray);
			return respDestPointer;
		}

		// takes an ArrayBuffer pointing to a two item Uint32Array consisting of a pointer and a byte length,
		// and returns a Uint8Array containing the data that it points to.
		function respToUint8Array(buffer) {
			const resultArray = new Uint32Array(buffer);
			const resultPointer = resultArray[0];
			const resultLength = resultArray[1];
			const srcArray = new Uint8Array(instance.exports.memory.buffer, resultPointer, resultLength);
			const destArray = new Uint8Array(resultLength);
			destArray.set(srcArray);

			return destArray;
		}

		const SVC_FINISH = 0;
		const SVC_GET_CURRENT_TIME = 1;
		const SVC_HTTP_FETCH = 2;
		const SVC_GET_RANDOM = 3;
		const SVC_DEBUG_LOG_MESSAGE = 4;
		const SVC_PING = 5;
		switch (serviceType) {
			case SVC_FINISH: {
				// param is a two item i32 array consisting of a pointer and a length
				const result = respToUint8Array(payloadBuffer);

				log("Job complete; result:", result);
				self.postMessage({ type: "complete", result });
				self.close();
			}
			case SVC_GET_CURRENT_TIME: {
				const buffer = new ArrayBuffer(SIZE_OF_I64);
				const view = new DataView(buffer);
				view.setBigUint64(0, BigInt(Date.now()));
				return syncResponse(buffer);
			}
			case SVC_DEBUG_LOG_MESSAGE: {
				if (!DEBUG_MODE) return;
				const decoder = new TextDecoder();
				const msg = decoder.decode(payloadBuffer);
				console.log("[JOB DEBUG]", msg);
				return EMPTY_RESPONSE;
			}
			case SVC_PING: {
				const p = new Promise((resolve) => {
					resolve(payloadBuffer);
				});
				return asyncResponse(p);
			}
			default:
				throw new Error(`Unsupported service type ${serviceType}`);
		}

		return EMPTY_RESPONSE;
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

