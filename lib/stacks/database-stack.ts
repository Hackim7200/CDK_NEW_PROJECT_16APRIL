import { Stack, StackProps } from "aws-cdk-lib";
import {
  AttributeType,
  Table as DynamoDBTable,
  ITable,
} from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

interface DataStackProps extends StackProps {
  appName: string;
}

export class DataStack extends Stack {
  /** Single table for all entities (todos) using PK/SK access patterns */
  public readonly userItemsTable: ITable;

  constructor(scope: Construct, id: string, props: DataStackProps) {
    super(scope, id, props);

    const { appName } = props;

    this.userItemsTable = new DynamoDBTable(this, "UserItemsTable", {
      partitionKey: {
        name: "PK",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "SK",
        type: AttributeType.STRING,
      },
      tableName: `${appName}-UserItems`,
    });
  }
}
