import { finishWithJSON, getPayloadJSON, JSON } from "./libjob";
export { allocateBytes, freeBytes, setPayload } from "./libjob";

export function main(): void {
	const payload = changetype<JSON.Arr>(getPayloadJSON());

	let result: i64 = 0;
	const numbers = payload.valueOf();
	for (let i = 0; i < numbers.length; i++) {
		result += changetype<JSON.Integer>(numbers[i]).valueOf();
	}

	finishWithJSON(new JSON.Integer(result));
}
