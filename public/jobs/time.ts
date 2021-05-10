import { finishWithUint8Array, getPayload, requestHostService } from "./libjob";
export { allocateBytes, freeBytes, serviceResponse, setPayload } from "./libjob";

export function main(): void {
	const GET_CURRENT_TIME = 1;
	requestHostService(GET_CURRENT_TIME, new ArrayBuffer(0), (id: i32, data: ArrayBuffer): void => {
		const time = (new DataView(data)).getInt64(0);
		const buffer: ArrayBuffer = String.UTF8.encode("The time is ".concat(time.toString()));
		finishWithUint8Array(Uint8Array.wrap(buffer));
	});
}
