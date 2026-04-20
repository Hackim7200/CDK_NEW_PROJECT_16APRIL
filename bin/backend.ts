#!/usr/bin/env node
import * as cdk from "aws-cdk-lib/core";
import { ApiGatewayStack } from "../lib/stacks/ApiGatewayStack";
import { AuthStack } from "../lib/stacks/AuthStack";
import { DynamodbStack } from "../lib/stacks/DynamodbStack";
import { LambdaStack } from "../lib/stacks/LambdaStack";
import { AppSyncStack } from "../lib/stacks/AppSyncStack";

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const appName = `PomodoroPlans`;

const auth = new AuthStack(app, `AuthStack-${appName}`, { env, appName });

const dynamodb = new DynamodbStack(app, `DynamodbStack-${appName}`, {
  env,
  appName,
});

const lambdas = new LambdaStack(app, `LambdaStack-${appName}`, {
  env,
  todoTable: dynamodb.todoTable,
});

const apiGateway = new ApiGatewayStack(app, `ApiGatewayStack-${appName}`, {
  env,
  appName,
  todosLambdaIntegration: lambdas.todosLambdaIntegration,
  profileLambdaIntegration: lambdas.profileLambdaIntegration,
  userPool: auth.userPool,
});

const appSync = new AppSyncStack(app, `AppSyncStack-${appName}`, {
  env,
  appName,
  todoTable: dynamodb.todoTable,
  userPool: auth.userPool,
});
