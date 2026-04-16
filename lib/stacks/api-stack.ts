const api = new apigwv2.HttpApi(this, 'TodoApi', {
    corsPreflight: {
      allowOrigins: ['*'],
      allowMethods: [apigwv2.CorsHttpMethod.ANY],
      allowHeaders: ['Authorization','Content-Type'],
    },
  });
  
  const authorizer = new apigwv2auth.HttpJwtAuthorizer(
    'CognitoAuthorizer',
    props.issuerUrl,
    { jwtAudience: [props.userPoolClientId] }
  );
  
  api.addRoutes({
    path: '/todos',
    methods: [apigwv2.HttpMethod.POST],
    integration: new integrations.HttpLambdaIntegration(
      'CreateTodo', props.createTodoFn),
    authorizer,
  });