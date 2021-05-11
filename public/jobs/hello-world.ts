import { debugMessage, finishWithUint8Array, getPayload } from "./libjob";
export { allocateBytes, freeBytes, setPayload } from "./libjob";

export function main(): void {
	const name = String.UTF8.decode(getPayload().buffer);
	debugMessage("this is a debug message");
	
	const buffer: ArrayBuffer = String.UTF8.encode("Hello, ".concat(name).concat("!"));
	finishWithUint8Array(Uint8Array.wrap(buffer));
}
