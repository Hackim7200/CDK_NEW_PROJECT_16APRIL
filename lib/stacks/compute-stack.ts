import { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { TodoService } from './service';

const service = new TodoService();

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer
) => {
  const userId = event.requestContext.authorizer.jwt.claims['sub'] as string;
  const body   = JSON.parse(event.body ?? '{}');

  const todo = await service.createTodo({ userId, ...body });
  return { statusCode: 201, body: JSON.stringify(todo) };
};