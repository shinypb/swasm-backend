import { JSON, JSONEncoder } from "assemblyscript-json"; 
export { JSON } from "assemblyscript-json"; 

@external("env", "requestService")
declare function requestService(serviceType: i32, payloadPointer: usize, payloadLength: i32): i32;

@external("env", "finish")
declare function finish(resultPointer: usize, resultLength: i32): void;

let payload: Uint8Array;
export function getPayload(): Uint8Array {
	return payload;
}

export function allocateBytes(size: i32): usize {
	return heap.alloc(size);
}

export function freeBytes(ptr: usize): void {
	heap.free(ptr);
}

type HostServiceCallback = (id: i32, data: ArrayBuffer) => void;
const pendingCallbacks = new Map<i32, HostServiceCallback>();
export function requestHostService(
	serviceType: i32,
	paramBuffer: ArrayBuffer,
	callback: HostServiceCallback,
): i32 {
	const paramArray = Uint8Array.wrap(paramBuffer);
	const id = requestService(serviceType, paramArray.dataStart, paramArray.byteLength);
	pendingCallbacks.set(id, callback);
	return id;
}

export function serviceResponse(id: i32, ptr: usize, size: i32): void {
	if (!pendingCallbacks.has(id)) return; // no one is waiting for this?

	const data = new Uint8Array(size);
	memory.copy(data.dataStart, ptr, size);

	const callback = pendingCallbacks.get(id);
	pendingCallbacks.delete(id);
	callback(id, data.buffer);
}

export function setPayload(ptr: usize, size: i32): usize {
	payload = new Uint8Array(size);
	memory.copy(payload.dataStart, ptr, size);
	return payload.length;
}

export function getPayloadJSON(): JSON.Value {
	const jsonStr = String.UTF8.decode(payload.buffer);
	return JSON.parse(jsonStr);
}

export function finishWithJSON(result: JSON.Value): void {
	const encoder = new JSONEncoder();
	encoder.writeKey("result");
	if (result.isString) {
		encoder.writeString(result.toString());
	} else {
		encoder.write(result.toString());
	}

	// note: encoder.toString() doesn't include the opening and closing braces
	const resultJsonString = "{".concat(encoder.toString()).concat("}");
	const resultJsonBuffer = String.UTF8.encode(resultJsonString);
	const resultArray = Uint8Array.wrap(resultJsonBuffer);
	finishWithUint8Array(resultArray);
}

export function finishWithUint8Array(result: Uint8Array): void {
	finish(result.dataStart, result.length);
}
