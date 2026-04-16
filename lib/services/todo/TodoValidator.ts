import { TodoEntry } from "./TodoModel";

// This file handles expected errors and throws understandable messages.

export class MissingFieldsError extends Error {
  constructor(missingFields: string) {
    super(`Value for ${missingFields} is required`);
  }
}
export class JsonError extends Error {}

export function validateAsTodoEntry(arg: any) {
  if ((arg as TodoEntry).userId === undefined) {
    throw new MissingFieldsError("userId");
  }
  if ((arg as TodoEntry).title === undefined) {
    throw new MissingFieldsError("title");
  }
  if ((arg as TodoEntry).completed === undefined) {
    throw new MissingFieldsError("completed");
  }

  if ((arg as TodoEntry).date === undefined) {
    throw new MissingFieldsError("date");
  }
  if ((arg as TodoEntry).timePeriod === undefined) {
    throw new MissingFieldsError("timePeriod");
  }
}
