import {
  APIGatewayAuthorizerResult,
  APIGatewayAuthorizerHandler, 
  APIGatewayTokenAuthorizerEvent} from 'aws-lambda';
import 'source-map-support/register';

export const handler: APIGatewayAuthorizerHandler = async (event: APIGatewayTokenAuthorizerEvent): Promise<APIGatewayAuthorizerResult> => {
  try {
    verifyToken(event.authorizationToken);
    console.log('User was authorised');
    
    return {
      principalId: 'user',
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
}

function verifyToken(authHeader: string) {
  console.log(authHeader);
  
  if (!authHeader)
    throw new Error('No authorisation header');

  if (!authHeader.toLocaleLowerCase().startsWith('bearer '))
    throw new Error('Invalid authorisation header');
    
  const split = authHeader.split(' ');
  const token = split[1];

  if (token !== '123')
    throw new Error('Invalid token');
  
  // A request has been authorised.
}