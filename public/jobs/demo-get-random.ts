import { finishWithUint8Array, getRandom } from "./libjob";
export { allocateBytes, freeBytes, asyncServiceResponseCallback, setPayload } from "./libjob";

export function main(): void {
	const NUM_BYTES = 2;
	const randomBytes: Uint8Array = getRandom(NUM_BYTES);

	const buffer: ArrayBuffer = String.UTF8.encode(
		"Two random numbers: "
		.concat(randomBytes[0].toString())
		.concat(", ")
		.concat(randomBytes[1].toString())
	);
	finishWithUint8Array(Uint8Array.wrap(buffer));
}
