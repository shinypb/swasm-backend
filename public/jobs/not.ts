import { finishWithJSON, getPayloadJSON, JSON } from "./libjob";
export { allocateBytes, freeBytes, setPayload } from "./libjob";

export function main(): void {
	const payload = changetype<JSON.Bool>(getPayloadJSON());
	const result = !payload.valueOf();

	finishWithJSON(new JSON.Bool(result));
}
