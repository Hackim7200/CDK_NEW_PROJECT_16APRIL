import {
  APIGatewayProxyEvent,
  Context,
  APIGatewayProxyResult,
} from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { postTodo } from "./PostTodo";
import { getTodos } from "./GetTodos";
import { updateTodo } from "./UpdateTodo";
import { deleteTodo } from "./DeleteTodo";
import { JsonError, MissingFieldsError } from "../../validators/TodoValidator";
import { addCorsHeader } from "../../shared/Utils";

const ddbClient = new DynamoDBClient({});

async function handler(
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  let response: APIGatewayProxyResult;

  try {
    switch (event.httpMethod) {
      case "GET":
        const getResponse = await getTodos(event, ddbClient);
        response = getResponse;
        break;

      case "POST":
        const postResponse = await postTodo(event, ddbClient);
        response = postResponse;
        break;

      case "PUT":
        const putResponse = await updateTodo(event, ddbClient);
        response = putResponse;
        break;

      case "DELETE":
        const deleteResponse = await deleteTodo(event, ddbClient);
        response = deleteResponse;
        break;

      default:
        response = {
          statusCode: 405,
          body: JSON.stringify({ message: "Method not allowed." }),
        };
        break;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error.";
    let errResponse: APIGatewayProxyResult;
    if (error instanceof MissingFieldsError) {
      errResponse = { statusCode: 400, body: message };
    } else if (error instanceof JsonError) {
      errResponse = { statusCode: 400, body: message };
    } else {
      errResponse = { statusCode: 500, body: message };
    }
    addCorsHeader(errResponse);
    return errResponse;
  }

  addCorsHeader(response);

  return response;
}

export { handler };
