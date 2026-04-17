import {
  BatchWriteItemCommand,
  DynamoDBClient,
  ScanCommand,
} from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";

const ddbClient = new DynamoDBClient({});

/**
 * Scheduled Lambda that deletes all todos with a date
 * older than today. Runs via EventBridge cron — no API Gateway involved.
 *
 * Scans for all TODO items, parses the date attribute, and removes any whose
 * date is before today (keeps today and tomorrow).
 */
export async function handler(): Promise<void> {
  const tableName = process.env.TABLE_NAME!;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  console.log(`Cleanup: removing todos older than ${todayStr}`);

  let lastEvaluatedKey: Record<string, any> | undefined;
  let deletedTodos = 0;

  do {
    const scanResult = await ddbClient.send(
      new ScanCommand({
        TableName: tableName,
        FilterExpression:
          "entityType = :todoType AND #date < :today",
        ExpressionAttributeNames: { "#date": "date" },
        ExpressionAttributeValues: {
          ":todoType": { S: "TODO" },
          ":today": { S: todayStr },
        },
        ExclusiveStartKey: lastEvaluatedKey,
      }),
    );

    const items = (scanResult.Items ?? []).map((item) => unmarshall(item));
    lastEvaluatedKey = scanResult.LastEvaluatedKey;

    for (const todo of items) {
      const pk = todo.PK as string;

      // Only delete the todo itself, 
      const keysToDelete = [
        { PK: { S: pk }, SK: { S: todo.SK as string } },
      ];

      // Batch delete in chunks of 25 (though only 1 here)
      for (let i = 0; i < keysToDelete.length; i += 25) {
        const chunk = keysToDelete.slice(i, i + 25);
        await ddbClient.send(
          new BatchWriteItemCommand({
            RequestItems: {
              [tableName]: chunk.map((key) => ({
                DeleteRequest: { Key: key },
              })),
            },
          }),
        );
      }

      deletedTodos++;
    }
  } while (lastEvaluatedKey);

  console.log(
    `Cleanup complete: ${deletedTodos} todo(s) deleted`,
  );
}
