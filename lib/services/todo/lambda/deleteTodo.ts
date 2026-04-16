import {
  BatchWriteItemCommand,
  DeleteItemCommand,
  DynamoDBClient,
  QueryCommand,
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

  // Delete all pomodoros belonging to this todo
  const pomodoroQuery = await ddbClient.send(
    new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
      ExpressionAttributeValues: {
        ":pk": { S: PK },
        ":skPrefix": { S: `ITEM#POMODORO#${id}` },
      },
      ProjectionExpression: "PK, SK",
    }),
  );

  const pomodoroItems = pomodoroQuery.Items ?? [];
  if (pomodoroItems.length > 0) {
    // BatchWriteItem supports up to 25 items per request
    const batches = [];
    for (let i = 0; i < pomodoroItems.length; i += 25) {
      const chunk = pomodoroItems.slice(i, i + 25);
      batches.push(
        ddbClient.send(
          new BatchWriteItemCommand({
            RequestItems: {
              [tableName]: chunk.map((item) => ({
                DeleteRequest: { Key: { PK: item.PK!, SK: item.SK! } },
              })),
            },
          }),
        ),
      );
    }
    await Promise.all(batches);
  }

  // Delete the todo itself
  const SK = `ITEM#TODO#${date}#${id}`;
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
      message: `Todo ${id} and ${pomodoroItems.length} pomodoro(s) deleted successfully`,
    }),
  };
}
