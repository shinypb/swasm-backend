import { debugMessage, finishWithBuffer, getPayload, requestHostServiceAsync, SVC_PING } from "./libjob";
export { allocateBytes, asyncServiceResponseCallback, freeBytes, setPayload } from "./libjob";

function areStringsEqual(a: String, b: String): bool {
	return (a.length === b.length && a.indexOf(b) === 0);
}

export function main(): void {
	const name = String.UTF8.decode(getPayload().buffer);
	debugMessage("making async call");

	const inputStr = "It worked!";
	requestHostServiceAsync(SVC_PING, String.UTF8.encode(inputStr), (data: ArrayBuffer): void => {
		const str = String.UTF8.decode(data);
		const outputStr = areStringsEqual(str, inputStr) ? "It worked :D" : "It did not work! input=".concat(inputStr).concat(", output=").concat(str);
		const buffer = String.UTF8.encode(outputStr);
		finishWithBuffer(buffer);
	});
}
