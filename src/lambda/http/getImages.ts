import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
// import 'source-map-support';
require('source-map-support').install();
import * as AWS from 'aws-sdk';

const docClient = new AWS.DynamoDB.DocumentClient();
const groupsTable = process.env.GROUPS_TABLE;
const imagesTable = process.env.IMAGES_TABLE;

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    
    console.log('CALLER event: ', event);
    const groupId = event.pathParameters.groupId;
    
    const validGroupId = await groupExists(groupId);

    if (!validGroupId) {
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'Group does not exist'
        })
      }
    }

    const images = await getImagesPerGroup(groupId);
    
    return {
        statusCode: 200,
        headers: {
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            items: images
        })
    };
};

async function groupExists(groupId: string) {
  const result = await docClient
    .get({
      TableName: groupsTable,
      Key: {
        id: groupId
      }
    }).promise();

    console.log('Get group: , result');
    return !!result.Item; // !! technique converts undefined to true, then to false if groupId doesn't exist. Or if does exist, convert to false, then to true.
}

async function getImagesPerGroup(groupId: string) {
  const result = await docClient
    .query({
      TableName: imagesTable,
      KeyConditionExpression: 'groupId = :groupId',
      ExpressionAttributeValues: {
        ':groupId': groupId
      },
      ScanIndexForward: false
    }).promise();

    return result.Items;
}