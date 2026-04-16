import { Stack, StackProps } from "aws-cdk-lib";
import {
  AuthorizationType,
  CognitoUserPoolsAuthorizer,
  Cors,
  LambdaIntegration,
  MethodOptions,
  ResourceOptions,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";
import { IUserPool } from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";

interface ApiStackProps extends StackProps {
  todosLambdaIntegration: LambdaIntegration;
  profileLambdaIntegration: LambdaIntegration;
  userPool: IUserPool;
}

export class ApiStack extends Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const api = new RestApi(this, "CountdownApi"); // Create a REST API named CountdownApi.

    const authorizer = new CognitoUserPoolsAuthorizer(
      this,
      "CountdownApiAuthorizer",
      {
        cognitoUserPools: [props.userPool],
        identitySource: "method.request.header.Authorization",
      },
    );
    authorizer._attachToApi(api);

    const optionsWithAuth: MethodOptions = {
      // Automatically authenticate requests before responding.
      authorizationType: AuthorizationType.COGNITO,
      authorizer: {
        authorizerId: authorizer.authorizerId,
      },
    };

    const optionsWithCors: ResourceOptions = {
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS,
      },
    };

    //////////// Todos Resource ////////////
    const todosResource = api.root.addResource("todos", optionsWithCors);

    todosResource.addMethod(
      "GET",
      props.todosLambdaIntegration,
      optionsWithAuth,
    );
    todosResource.addMethod(
      "POST",
      props.todosLambdaIntegration,
      optionsWithAuth,
    );
    todosResource.addMethod(
      "PUT",
      props.todosLambdaIntegration,
      optionsWithAuth,
    );
    todosResource.addMethod(
      "DELETE",
      props.todosLambdaIntegration,
      optionsWithAuth,
    );

    //////////// Profile Resource ////////////
    const profileResource = api.root.addResource("profile", optionsWithCors);
    profileResource.addMethod(
      "DELETE",
      props.profileLambdaIntegration,
      optionsWithAuth,
    );
  }
}
