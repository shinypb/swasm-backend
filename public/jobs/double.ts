import { finishWithJSON, getPayloadJSON, JSON } from "./libjob";
export { allocateBytes, freeBytes, setPayload } from "./libjob";

export function main(): void {
	const payload = changetype<JSON.Integer>(getPayloadJSON());
	const result: i64 = payload.valueOf() * 2;

	finishWithJSON(new JSON.Integer(result));
}
