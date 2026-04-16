import {
  DynamoDBClient,
  QueryCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

export async function updateTodo(
  event: APIGatewayProxyEvent,
  ddbClient: DynamoDBClient,
): Promise<APIGatewayProxyResult> {
  const params = event.queryStringParameters ?? {};
  const userId = params.userId;
  const id = params.id;

  if (!userId || !id || !event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Please provide userId, id, and body." }),
    };
  }

  const PK = `USER#${userId}`;

  // Find the item by Query to get PK and SK
  const queryResult = await ddbClient.send(
    new QueryCommand({
      TableName: process.env.TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
      FilterExpression: "#id = :id",
      ExpressionAttributeNames: { "#id": "id" },
      ExpressionAttributeValues: {
        ":pk": { S: PK },
        ":skPrefix": { S: "ITEM#TODO#" },
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
  const SK = item.SK;

  const parsedBody = JSON.parse(event.body);
  const requestBodyKey = Object.keys(parsedBody)[0];
  const requestBodyValue = parsedBody[requestBodyKey];
  const marshalledValue = marshall({ value: requestBodyValue }).value;

  const updateResult = await ddbClient.send(
    new UpdateItemCommand({
      TableName: process.env.TABLE_NAME,
      Key: {
        PK: { S: PK },
        SK: { S: SK },
      },
      UpdateExpression: "set #zzzNew = :new",
      ExpressionAttributeValues: {
        ":new": marshalledValue,
      },
      ExpressionAttributeNames: {
        "#zzzNew": requestBodyKey,
      },
      ReturnValues: "UPDATED_NEW",
    }),
  );

  return {
    statusCode: 200,
    body: JSON.stringify(unmarshall(updateResult.Attributes ?? {})),
  };
}
