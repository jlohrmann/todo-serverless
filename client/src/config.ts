// TODO: Once your application is deployed, copy an API id here so that the frontend could interact with it
const apiId = 'awhh2ixjw2'
export const apiEndpoint = `https://${apiId}.execute-api.us-west-2.amazonaws.com/dev`

export const authConfig = {
  // TODO: Create an Auth0 application and copy values from it into this map
  domain: 'dev-hvhzg7fv.us.auth0.com',            // Auth0 domain
  clientId: 'ExiHZ0k4PmFsg3iXmZbrFQ2cZgNImrva',          // Auth0 client id
  callbackUrl: 'http://localhost:3000/callback'
}