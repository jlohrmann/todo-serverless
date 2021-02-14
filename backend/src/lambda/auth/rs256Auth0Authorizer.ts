
import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify } from 'jsonwebtoken'
import { JwtToken } from '../../auth/JwtToken'

const cert = `-----BEGIN CERTIFICATE-----
MIIDDTCCAfWgAwIBAgIJcPFVAxXS8HtcMA0GCSqGSIb3DQEBCwUAMCQxIjAgBgNV
BAMTGWRldi1odmh6Zzdmdi51cy5hdXRoMC5jb20wHhcNMjEwMjExMjM0NjM0WhcN
MzQxMDIxMjM0NjM0WjAkMSIwIAYDVQQDExlkZXYtaHZoemc3ZnYudXMuYXV0aDAu
Y29tMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAkj6tNtVQsUv0ijYq
IaTHM9giTTEHqC+K/wA7sfJyHBOCC8Crfz2Ens17XgMCAJBGHbb+svKEi0zNW4ks
Z8TJgQd4SdaMGpBUDZkNK2ZGwZZVEfrCO4Ewddyd3SPcvi/dleGEry1UbtFogNKG
YR6nUAwXzUMss1GmBKcQqKiInULuAnGhAlzl6oh8t/jh9f18JXjG8WGhT9PmsvIU
njW8zMgnGTMP5x4Qz3IqrLsZjJt24dJbTHkMF/O+tq49lrWK8iHqPRGMElm9weVO
6m8RPKQoM37/u/DhfusGfFgZ1Ie+7zlhT7670H0pavcV2RG8iqofWBOT66/yCFeI
922dTQIDAQABo0IwQDAPBgNVHRMBAf8EBTADAQH/MB0GA1UdDgQWBBQ2JLRI8lJg
axND1vLDgxgVDj8YFTAOBgNVHQ8BAf8EBAMCAoQwDQYJKoZIhvcNAQELBQADggEB
ABjkeHfOxkHm9GtNruQfZs+CRoagw+8kPTZWUvD6fjMicrVQgSAtQNPRF4GWUht/
MTvmIFOhZwjudifHs9vLr0YD02zQkdBz+ksnwayyYCRgqpbPWLkrXmCRt5lGomfp
vcjP5MTiAxxcb0WkUuS9tDdqBHfJbYNYBhWoe40V61QsIfD7JlzaYDeBp1Kxdfim
j7IhDGbYZfq8k4Zdn5988TOjRsjfAIQR4bAkcv1oaHMFhadaJ8Pfwro3OsuEICHB
q814vmvkIHGY9xR9vo6G8ZVfyTnz+Ix0Vthzkz/gBvIjZ3g3FgqUeWJ2Lay7MuHn
z87hJB8N5kAe2+3/oU+iNm4=
-----END CERTIFICATE-----`

export const handler = async (event: CustomAuthorizerEvent): Promise<CustomAuthorizerResult> => {
  try {
    const jwtToken = verifyToken(event.authorizationToken)
    console.log('User was authorized', jwtToken)

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
    console.log('User authorized', e.message)

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

function verifyToken(authHeader: string): JwtToken {
  if (!authHeader)
    throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return verify(token, cert, { algorithms: ['RS256'] }) as JwtToken
}
