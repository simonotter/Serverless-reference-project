import {
  APIGatewayAuthorizerResult,
  APIGatewayTokenAuthorizerEvent} from 'aws-lambda';
import 'source-map-support/register';

import { verify } from 'jsonwebtoken';
import { JwtToken } from '../../auth/JwtToken';

import * as middy from 'middy';
import { secretsManager } from 'middy/middlewares';

const secretId = process.env.AUTH_0_SECRET_ID;
const secretField = process.env.AUTH_0_SECRET_FIELD;


export const handler = middy(async (
  event: APIGatewayTokenAuthorizerEvent,
  context): Promise<APIGatewayAuthorizerResult> => {
  try {
    const decodedToken = verifyToken(
      event.authorizationToken,
      context.AUTH0_SECRET[secretField]
    );
    console.log('User was authorised');
    
    return {
      principalId: decodedToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }


  } catch (e) {
    console.log('User was not authorised', e.message);

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }

  }
})

function verifyToken(authHeader: string, secret: string): JwtToken {
  
  if (!authHeader)
    throw new Error('No authorisation header');

  if (!authHeader.toLocaleLowerCase().startsWith('bearer '))
    throw new Error('Invalid authorisation header');
    
  const split = authHeader.split(' ');
  const token = split[1];

  return verify(token, secret) as JwtToken;
}

handler.use(
  secretsManager({
    cache: true,
    cacheExpiryInMillis: 60000,
    throwOnFailedCall: true,
    secrets: {
      AUTH0_SECRET: secretId
    }
  })
)