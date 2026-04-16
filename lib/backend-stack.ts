import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";
import { AuthStack } from "./stacks/auth-stack";
import { LambdaStack } from "./stacks/lambda-stack";
import { DataStack } from "./stacks/database-stack";
import { ApiStack } from "./stacks/api-stack";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class BackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const app = new cdk.App();
    const env = {
      account: process.env.CDK_DEFAULT_ACCOUNT, // this is your cli credential not set manually
      region: process.env.CDK_REGION,
    };
    const appName = `PomodoroPlans`; // Removed 'Pomodoro'

    const auth = new AuthStack(app, "AuthStack", { env, appName: appName });
    const database = new DataStack(app, "DatabaseStack", {
      env,
      appName: appName,
    });

    const compute = new LambdaStack(app, "ComputeStack", {
      env,
      userItemsTable: database.userItemsTable,
    });

    new ApiStack(app, "ApiStack", {
      env,
      todosLambdaIntegration: compute.todosLambdaIntegration,
      profileLambdaIntegration: compute.profileLambdaIntegration,
      userPool: auth.userPool,
      // ... remaining functions
    });
  }
}


