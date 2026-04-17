import {
  DeleteItemCommand,
  DynamoDBClient,
} from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

export async function deleteTodo(
  event: APIGatewayProxyEvent,
  ddbClient: DynamoDBClient,
): Promise<APIGatewayProxyResult> {
  const params = event.queryStringParameters ?? {};
  const userId = params.userId;
  const id = params.id;
  const date = params.date;

  if (!userId || !id || !date) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Please provide userId, id, and date." }),
    };
  }

  const tableName = process.env.TABLE_NAME!;
  const PK = `USER#${userId}`;
  const SK = `ITEM#TODO#${date}#${id}`;

  // Delete the todo itself
  await ddbClient.send(
    new DeleteItemCommand({
      TableName: tableName,
      Key: {
        PK: { S: PK },
        SK: { S: SK },
      },
    }),
  );

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: `Todo ${id} deleted successfully`,
    }),
  };
}
