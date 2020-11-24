import { APIGatewayProxyHandler, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import * as AWS  from 'aws-sdk'
import * as uuid from 'uuid'


const docClient = new AWS.DynamoDB.DocumentClient()

const groupsTable = process.env.GROUPS_TABLE
const imagesTable = process.env.IMAGES_TABLE

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Processing event: ', event)
  const groupId = event.pathParameters.groupId
  const validGroupId = await groupExists(groupId)

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

  // Create an image
  const imageId = uuid.v4();
  const newItem = await createImage(groupId, imageId, event);

  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      newItem: newItem
    })
  }
}

async function groupExists(groupId: string) {
  const result = await docClient
    .get({
      TableName: groupsTable,
      Key: {
        id: groupId
      }
    })
    .promise()

  console.log('Get group: ', result)
  return !!result.Item // !! technique converts undefined to true, then to false if groupId doesn't exist. Or if does exist, convert to false, then to true.
}


async function createImage(groupId: string, imageId: string, event: any) {
  const newImage = JSON.parse(event.body);
  const timestamp = new Date().toISOString()

  const newItem = {
    groupId: groupId,
    timestamp: timestamp,
    imageId: imageId,
    ...newImage
  }

  console.log('Storing new item:', newItem);

  await docClient.put({
    TableName: imagesTable,
    Item: newItem
  }).promise();

  return newItem;
}