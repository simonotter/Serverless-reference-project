import { APIGatewayProxyHandler, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import * as AWS  from 'aws-sdk'
import * as uuid from 'uuid'

import * as middy from 'middy';
import { cors } from 'middy/middlewares';

const docClient = new AWS.DynamoDB.DocumentClient()

const s3 = new AWS.S3({
  signatureVersion: 'v4'
});

const groupsTable = process.env.GROUPS_TABLE
const imagesTable = process.env.IMAGES_TABLE
const bucketName = process.env.IMAGES_S3_BUCKET;
const urlExpiration : Number = Number(process.env.SIGNED_URL_EXPIRATION);

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Processing event: ', event)
  const groupId = event.pathParameters.groupId
  const validGroupId = await groupExists(groupId)

  if (!validGroupId) {
    return {
      statusCode: 404,
      body: JSON.stringify({
        error: 'Group does not exist'
      })
    }
  }

  // Create an image
  const imageId = uuid.v4();
  const newItem = await createImage(groupId, imageId, event);

  const url = getUploadUrl(imageId);

  return {
    statusCode: 201,
    body: JSON.stringify({
      newItem: newItem,
      uploadUrl: url
    })
  }
})

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
    ...newImage,
    imageUrl: `https://${bucketName}.s3.amazonaws.com/${imageId}`
  }

  console.log('Storing new item:', newItem);

  await docClient.put({
    TableName: imagesTable,
    Item: newItem
  }).promise();

  return newItem;
}

function getUploadUrl(imageId: string) {
  return s3.getSignedUrl('putObject', {
    Bucket: bucketName,
    Key: imageId,
    Expires: urlExpiration
  })
}

handler.use(
  cors({
    credentials: true
  })
)
