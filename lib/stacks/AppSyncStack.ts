import { CfnOutput, Duration, Expiration, Stack, StackProps } from "aws-cdk-lib";
import {
  AuthorizationType,
  Code,
  Definition,
  FieldLogLevel,
  FunctionRuntime,
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
    const api = new GraphqlApi(this, `${props.appName}-AppSyncApi`, {
      name: `${props.appName}-AppSyncApi`,
      definition: Definition.fromFile(
        path.join(__dirname, "graphql/schema.graphql"),
      ),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: AuthorizationType.USER_POOL,
          userPoolConfig: {
            userPool: props.userPool,
          },
        },
        // API key auth for local / tool testing (send header `x-api-key: <key>`).
        additionalAuthorizationModes: [
          {
            authorizationType: AuthorizationType.API_KEY,
            apiKeyConfig: {
              expires: Expiration.after(Duration.days(365)),
            },
          },
        ],
      },
      logConfig: {
        fieldLogLevel: FieldLogLevel.ALL,
      },
      xrayEnabled: true,
    });
    // Add the Datasource that my resolvers will make use of
    const todosDS = api.addDynamoDbDataSource("TodoDS", props.todoTable);

    const todoResolversDir = path.join(__dirname, "../services/todo/resolvers");

    // Add the resolvers that will make use of the datasource
    api.createResolver("getTodoResolver", {
      typeName: "Query",
      fieldName: "getTodo",
      dataSource: todosDS,
      runtime: FunctionRuntime.JS_1_0_0,
      code: Code.fromAsset(path.join(todoResolversDir, "getTodo.js")),
    });

    api.createResolver("listTodosResolver", {
      typeName: "Query",
      fieldName: "listTodos",
      dataSource: todosDS,
      runtime: FunctionRuntime.JS_1_0_0,
      code: Code.fromAsset(path.join(todoResolversDir, "listTodos.js")),
    });

    api.createResolver("createTodoResolver", {
      typeName: "Mutation",
      fieldName: "createTodo",
      dataSource: todosDS,
      runtime: FunctionRuntime.JS_1_0_0,
      code: Code.fromAsset(path.join(todoResolversDir, "createTodo.js")),
    });

    api.createResolver("updateTodoResolver", {
      typeName: "Mutation",
      fieldName: "updateTodo",
      dataSource: todosDS,
      runtime: FunctionRuntime.JS_1_0_0,
      code: Code.fromAsset(path.join(todoResolversDir, "updateTodo.js")),
    });

    api.createResolver("deleteTodoResolver", {
      typeName: "Mutation",
      fieldName: "deleteTodo",
      dataSource: todosDS,

      runtime: FunctionRuntime.JS_1_0_0,
      code: Code.fromAsset(path.join(todoResolversDir, "deleteTodo.js")),
    });

    new CfnOutput(this, "AppSyncGraphqlUrl", {
      value: api.graphqlUrl,
      description: "AppSync GraphQL HTTPS endpoint",
    });
    new CfnOutput(this, "AppSyncApiKey", {
      value: api.apiKey ?? "",
      description: "AppSync API key for testing (x-api-key header)",
    });
  }
}
