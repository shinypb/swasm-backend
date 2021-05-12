import { debugMessage, finishWithBuffer, getPayload, httpFetch, SVC_PING } from "./libjob";
export { allocateBytes, asyncServiceResponseCallback, freeBytes, setPayload } from "./libjob";

export function main(): void {
	httpFetch("/hello", (data: ArrayBuffer): void => {
		const str = String.UTF8.decode(data);
		const outputStr = "Got response from server: ".concat(str);
		const buffer = String.UTF8.encode(outputStr);
		finishWithBuffer(buffer);
	});
}
