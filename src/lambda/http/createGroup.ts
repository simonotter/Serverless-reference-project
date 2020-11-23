import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
// import 'source-map-support/register';
require('source-map-support').install();

import * as AWS from 'aws-sdk';
import * as uuid from 'uuid'

const docClient = new AWS.DynamoDB.DocumentClient();
const groupsTable = process.env.GROUPS_TABLE;

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Processing event: ', event);
  const itemId = uuid.v4();

  const parsedBody = JSON.parse(event.body);

  const newItem = {
    id: itemId,
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

};