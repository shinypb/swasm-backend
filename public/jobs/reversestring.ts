import { finishWithUint8Array, getPayload } from "./libjob";
export { allocateBytes, freeBytes, setPayload } from "./libjob";

export function main(): void {
	const payload = String.UTF8.decode(getPayload().buffer);
	
	let reversedString = "";
	for (let i = 0; i < payload.length; i++) {
		reversedString = payload.slice(i, i + 1).concat(reversedString);
	}
	const buffer: ArrayBuffer = String.UTF8.encode(reversedString);
	finishWithUint8Array(Uint8Array.wrap(buffer));
}
