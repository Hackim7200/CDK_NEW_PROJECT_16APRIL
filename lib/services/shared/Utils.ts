import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { JsonError } from "../validators/TodoValidator";

/** Parses request body: accepts string (JSON) or already-parsed object (e.g. from API Gateway). */
export function parseJson(arg: any) {
  if (arg == null) {
    throw new JsonError("Request body is missing");
  }
  if (typeof arg === "object") {
    return arg;
  }
  if (typeof arg !== "string") {
    throw new JsonError("Request body must be JSON string or object");
  }
  try {
    return JSON.parse(arg);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new JsonError(msg);
  }
}

export function addCorsHeader(arg: APIGatewayProxyResult) {
  if (!arg.headers) {
    arg.headers = {};
  }
  //this needs to be specific ip address when UI id developed
  arg.headers["Access-Control-Allow-Origin"] = "*";
  arg.headers["Access-Control-Allow-Methods"] = "*";
}

// this method is a simple function that check if its admin or not and can be used within lambda function
export function hasAdminGroup(event: APIGatewayProxyEvent) {
  const groups = event.requestContext.authorizer?.claims["cognito:groups"];
  if (groups) {
    return (groups as string).includes("admins");
  }
  return false;
}
