import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { unmarshall } from "@aws-sdk/util-dynamodb";

// this function is used to get the pomodoro count for a given todo
// since there is no JOIN in DynamoDB we have to query the pomodoros table separately
// We are using UserID and TodoID to query the pomodoros table
async function getPomodoroCount(
  ddbClient: DynamoDBClient,
  pk: string,
  todoId: string,
): Promise<number> {
  const result = await ddbClient.send(
    new QueryCommand({
      TableName: process.env.TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
      ExpressionAttributeValues: {
        ":pk": { S: pk },
        ":skPrefix": { S: `ITEM#POMODORO#${todoId}` },
      },
      Select: "COUNT",
    }),
  );
  return result.Count ?? 0;
}

export async function getTodos(
  event: APIGatewayProxyEvent,
  ddbClient: DynamoDBClient,
): Promise<APIGatewayProxyResult> {
  const params = event.queryStringParameters ?? {};
  const userId = params.userId;
  const date = params.date;
  const id = params.id;

  if (!userId) {
    return {
      statusCode: 400,
      body: JSON.stringify("Please provide userId."),
    };
  }

  const PK = `USER#${userId}`;
  const SK = `ITEM#TODO#${date}`; // filter for the date

  // Get single todo by id: Query PK and filter by id
  if (id) {
    const queryResult = await ddbClient.send(
      new QueryCommand({
        TableName: process.env.TABLE_NAME,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
        FilterExpression: "#id = :id", // this is extra filter to filter for the id of TODO or event
        ExpressionAttributeNames: { "#id": "id" },
        ExpressionAttributeValues: {
          ":pk": { S: PK },
          ":skPrefix": { S: SK },
          ":id": { S: id },
        },
      }),
    );
    const items = queryResult.Items ?? [];
    if (items.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: `Todo not found with id: ${id}` }),
      };
    }
    const item = unmarshall(items[0]);
    // Attach the pomodoro count for this single todo
    item.pomodoros = await getPomodoroCount(ddbClient, PK, item.id);
    return {
      statusCode: 200,
      body: JSON.stringify(item),
    };
  }

  // List all todos for user: Query PK with SK prefix
  const listResult = await ddbClient.send(
    new QueryCommand({
      TableName: process.env.TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
      ExpressionAttributeValues: {
        ":pk": { S: PK },
        ":skPrefix": { S: SK },
      },
    }),
  );
  const unmarshalledItems = (listResult.Items ?? []).map((item) =>
    unmarshall(item),
  );

  // For each todo, fetch its pomodoro count in parallel using Promise.all.
  // Each todo gets a separate COUNT query because pomodoros live under
  // a different SK prefix and can't be included in the todos query above.
  const itemsWithCounts = await Promise.all(
    unmarshalledItems.map(async (todo) => ({
      ...todo,
      pomodoros: await getPomodoroCount(ddbClient, PK, todo.id),
    })),
  );

  return {
    statusCode: 200,
    body: JSON.stringify(itemsWithCounts),
  };
}
