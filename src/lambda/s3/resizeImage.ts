import { S3EventRecord, SNSEvent, SNSHandler } from 'aws-lambda'
import 'source-map-support/register'
import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk';
import Jimp from 'jimp/es'

const XAWS = AWSXRay.captureAWS(AWS);

const s3 = new XAWS.S3()

const imagesBucketName = process.env.IMAGES_S3_BUCKET
const thumbnailBucketName = process.env.THUMBNAILS_S3_BUCKET

export const handler: SNSHandler = async (event: SNSEvent) => {
  console.log('Processing SNS event ', JSON.stringify(event));
  for (const snsRecord of event.Records) {
    const s3EventStr = snsRecord.Sns.Message;
    console.log('Processing S3 event ', s3EventStr);
    const s3Event = JSON.parse(s3EventStr);
    
    for (const record of s3Event.Records) {
      await resizeImage(record);
    }
  }
}

async function resizeImage(record: S3EventRecord) {
  const key = record.s3.object.key;
  console.log('Processing S3 item with key: ', key)

  const response = await s3
    .getObject({
      Bucket: imagesBucketName,
      Key: key
    })
    .promise();

  const body: string = response.Body as string;

  // Read an image with the Jimp libary
  const image = await Jimp.read(body);

  // Resize the image maintaining the aspect ratio
  console.log('Resizing image');
  image.resize(150, Jimp.AUTO);

  // Convert the image to a buffer that we can write to a different bucket
  const convertedBuffer = await image.getBufferAsync(Jimp.AUTO.toString());

  // Write resized image to thumbnails bucket
  await s3
    .putObject({
      Bucket: thumbnailBucketName,
      Key: `${key}.jpeg`,
      Body: convertedBuffer
    })
    .promise();
}

