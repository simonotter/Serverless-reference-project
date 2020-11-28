import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import 'source-map-support/register';

import { CreateGroupRequest } from '../../requests/CreateGroupRequest';
import { createGroup } from '../../businessLogic/groups'

import * as middy from 'middy';
import { cors } from 'middy/middlewares';

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Processing event: ', event);
  
  const newGroup: CreateGroupRequest = JSON.parse(event.body);
  const authorization = event.headers.Authorization;
  const split = authorization.split(' ');
  const jwtToken = split[1];

  const newItem = await createGroup(newGroup, jwtToken)

  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow_Origin': '*'
    },
    body: JSON.stringify({
      newItem
    })
  }

})

handler.use(
  cors({
    credentials: true
  })
)
