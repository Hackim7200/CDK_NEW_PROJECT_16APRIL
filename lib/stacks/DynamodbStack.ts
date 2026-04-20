import { Stack, StackProps } from "aws-cdk-lib";
import {
  AttributeType,
  Table as DynamoDBTable,
  ITable,
} from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

interface DynamodbStackProps extends StackProps {
  appName: string;
}

export class DynamodbStack extends Stack {
  /** Single table for all entities (todos) using PK/SK access patterns */
  public readonly todoTable: ITable;

  constructor(scope: Construct, id: string, props: DynamodbStackProps) {
    super(scope, id, props);

    const { appName } = props;

    // Todos table
    this.todoTable = new DynamoDBTable(this, `${appName}-TodosTable`, {
      partitionKey: {
        name: "PK",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "SK",
        type: AttributeType.STRING,
      },
      tableName: `${appName}-Todos`,
    });
  }
}
