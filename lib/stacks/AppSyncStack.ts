import { Stack, StackProps } from "aws-cdk-lib";
import {
  AuthorizationType,
  Definition,
  FieldLogLevel,
  GraphqlApi,
} from "aws-cdk-lib/aws-appsync";
import { IUserPool } from "aws-cdk-lib/aws-cognito";
import { ITable } from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";
import * as path from "path";

interface AppSyncStackProps extends StackProps {
  appName: string;
  todoTable: ITable;
  userPool: IUserPool;
}

export class AppSyncStack extends Stack {
  constructor(scope: Construct, id: string, props: AppSyncStackProps) {
    super(scope, id, props);

    // Same pool and client pattern as ApiGatewayStack: Cognito JWT in `Authorization` (typically the ID token).
    // AppSync uses USER_POOL auth instead of RestApi + CognitoUserPoolsAuthorizer.
    new GraphqlApi(this, `${props.appName}-AppSyncApi`, {
      name: `${props.appName}-AppSyncApi`,
      definition: Definition.fromFile(path.join(__dirname, "schema.graphql")),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: AuthorizationType.USER_POOL,
          userPoolConfig: {
            userPool: props.userPool,
          },
        },
      },
      logConfig: {
        fieldLogLevel: FieldLogLevel.ALL,
      },
      xrayEnabled: true,
    });
  }
}
