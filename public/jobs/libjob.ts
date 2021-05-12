import { JSON, JSONEncoder } from "assemblyscript-json"; 
export { JSON } from "assemblyscript-json"; 

@external("env", "requestService")
declare function requestService(serviceType: i32, payloadPointer: usize, payloadLength: i32): i32;

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

export const SVC_FINISH = 0;
export const SVC_GET_CURRENT_TIME = 1;
export const SVC_HTTP_FETCH = 2;
export const SVC_GET_RANDOM = 3;
export const SVC_DEBUG_LOG_MESSAGE = 4;
export const SVC_PING = 5;

export function getCurrentTime(): i64 {
	debugMessage("in getCurrentTime");
	const data = requestHostService(SVC_GET_CURRENT_TIME);
	debugMessage("got data back");
	const time = (new DataView(data)).getInt64(0);
	return time;
}

export function debugMessage(str: String): void {
	requestHostService(SVC_DEBUG_LOG_MESSAGE, String.UTF8.encode(str));
}

function unwrapServiceResponse(ptr: i32): ArrayBuffer {
	if (ptr === 0) return new ArrayBuffer(0);

	// A service response is always a two item Uint32Array
	const SERVICE_RESPONSE_SIZE = 2;
	const respData = new Uint32Array(SERVICE_RESPONSE_SIZE);
	memory.copy(respData.dataStart, ptr, respData.buffer.byteLength);

	// The first item of the array is a pointer to the result, and the second is its length
	const dataPointer = respData[0];
	const dataLength = respData[1];
	const serviceData = new Uint8Array(dataLength);
	memory.copy(serviceData.dataStart, dataPointer, dataLength);

	return serviceData.buffer;
}

export function requestHostService(
	serviceType: i32,
	paramBuffer: ArrayBuffer = new ArrayBuffer(0),
): ArrayBuffer {
	const paramArray = Uint8Array.wrap(paramBuffer);
	return unwrapServiceResponse(requestService(serviceType, paramArray.dataStart, paramArray.byteLength));
}

type HostServiceCallback = (id: i32, data: ArrayBuffer) => void;
const pendingCallbacks = new Map<i32, HostServiceCallback>();
export function requestHostServiceAsync(
	serviceType: i32,
	paramBuffer: ArrayBuffer = new ArrayBuffer(0),
	callback: HostServiceCallback = () => {},
): void {
	const resp = requestHostService(serviceType, paramBuffer);
	const dataView = new DataView(resp);
	const id = dataView.getInt32(0);
	pendingCallbacks.set(id, callback);
}

export function asyncServiceResponseCallback(id: i32, ptr: usize, size: i32): void {
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

export function finishWithUint8Array(arr: Uint8Array): void {
	const result = new Uint32Array(2);
	result[0] = changetype<i32>(arr.dataStart);
	result[1] = arr.buffer.byteLength;
	requestHostService(SVC_FINISH, result.buffer);
}
