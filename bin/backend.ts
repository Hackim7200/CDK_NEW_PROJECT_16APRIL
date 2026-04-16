#!/usr/bin/env node
import * as cdk from "aws-cdk-lib/core";
import { ApiStack } from "../lib/stacks/api-stack";
import { AuthStack } from "../lib/stacks/auth-stack";
import { DataStack } from "../lib/stacks/database-stack";
import { LambdaStack } from "../lib/stacks/lambda-stack";

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const appName = `PomodoroPlans`; 

const auth = new AuthStack(app, `AuthStack-${appName}`, { env, appName });
const database = new DataStack(app, `DatabaseStack-${appName}`, {
  env,
  appName,
});

const compute = new LambdaStack(app, `ComputeStack-${appName}`, {
  env,
  userItemsTable: database.userItemsTable,
});

new ApiStack(app, `ApiStack-${appName}`, {
  env,
  todosLambdaIntegration: compute.todosLambdaIntegration,
  profileLambdaIntegration: compute.profileLambdaIntegration,
  userPool: auth.userPool,
});
