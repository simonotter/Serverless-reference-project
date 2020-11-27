import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
// import 'source-map-support/register';
require('source-map-support').install();
import { getUserId } from '../../auth/utils';

import * as AWS from 'aws-sdk';
import * as uuid from 'uuid'

import * as middy from 'middy';
import { cors } from 'middy/middlewares';

const docClient = new AWS.DynamoDB.DocumentClient();
const groupsTable = process.env.GROUPS_TABLE;

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Processing event: ', event);
  const itemId = uuid.v4();

  const authorization = event.headers.Authorization;
  const split = authorization.split(' ');
  const jwtToken = split[1];

  const userId = getUserId(jwtToken);

  const parsedBody = JSON.parse(event.body);

  const newItem = {
    id: itemId,
    userId: userId,
    ...parsedBody
  }

  await docClient.put({
    TableName: groupsTable,
    Item: newItem
  }).promise();

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
