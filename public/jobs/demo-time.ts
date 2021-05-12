import { finishWithUint8Array, getPayload, getCurrentTime, debugMessage } from "./libjob";
export { allocateBytes, freeBytes, asyncServiceResponseCallback, setPayload } from "./libjob";

export function main(): void {
	const time = getCurrentTime();
	const buffer: ArrayBuffer = String.UTF8.encode("The time is ".concat(time.toString()));
	finishWithUint8Array(Uint8Array.wrap(buffer));
}
