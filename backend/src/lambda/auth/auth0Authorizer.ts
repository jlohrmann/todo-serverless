import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify, decode } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
import Axios from 'axios'
import { Jwt } from '../../auth/Jwt'
import { JwtPayload } from '../../auth/JwtPayload'
import { jwkToPem } from 'jwk-to-pem'

const logger = createLogger('auth')

// TODO: Provide a URL that can be used to download a certificate that can be used
// to verify JWT token signature.
// To get this URL you need to go to an Auth0 page -> Show Advanced Settings -> Endpoints -> JSON Web Key Set
const jwksUrl = 'https://dev-hvhzg7fv.us.auth0.com/.well-known/jwks.json'

export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
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
    logger.error('User not authorized', { error: e.message })

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

async function verifyToken(token: string): Promise<JwtPayload> {
  const jwt: Jwt = decode(token, { complete: true }) as Jwt;
  // You can provide additional information with every log statement
  // This information can then be used to search for log statements in a log storage system
  logger.info('Auth Details', {
    // Additional information stored with a log statement
    token: token,
    jwt: jwt
  })
  // TODO: Implement token verification
  const response = await Axios(jwksUrl);
  const responseData = response.data;
  const signingKey = responseData['keys'].find(key => key['kid'] === jwt['header']['kid']);
  logger.info('Auth REsponse', {
    // Additional information stored with a log statement
    jwksUrl: jwksUrl,
    responseData: responseData,
    signingKey: signingKey
  })
  if (!signingKey) {
    throw new Error('Invalid Signing key');
  }
  return verify(token, jwkToPem(signingKey), {algorithms: ['RS256']}) as JwtPayload;
}