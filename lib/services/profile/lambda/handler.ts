import {
  APIGatewayProxyEvent,
  Context,
  APIGatewayProxyResult,
} from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { deleteUserData } from "./DeleteUserData";
import { addCorsHeader } from "../../shared/Utils";

const ddbClient = new DynamoDBClient({});

async function handler(
  event: APIGatewayProxyEvent,
  _context: Context,
): Promise<APIGatewayProxyResult> {
  let response: APIGatewayProxyResult;

  try {
    switch (event.httpMethod) {
      case "DELETE":
        response = await deleteUserData(event, ddbClient);
        break;
      default:
        response = {
          statusCode: 405,
          body: JSON.stringify({ message: "Method not allowed." }),
        };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error.";
    response = {
      statusCode: 500,
      body: JSON.stringify({ message }),
    };
  }

  addCorsHeader(response);
  return response;
}

export { handler };
