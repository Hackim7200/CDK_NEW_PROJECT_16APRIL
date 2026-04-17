import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { unmarshall } from "@aws-sdk/util-dynamodb";

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

  return {
    statusCode: 200,
    body: JSON.stringify(unmarshalledItems),
  };
}
