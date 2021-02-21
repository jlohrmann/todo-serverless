import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import * as AWS  from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import * as uuid from 'uuid'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import { parseUserId } from '../../auth/utils'

const XAWS = AWSXRay.captureAWS(AWS)
const docClient = new XAWS.DynamoDB.DocumentClient()

const s3 = new AWS.S3({
  signatureVersion: 'v4'
})

const todosTable = process.env.TODOS_TABLE
const imagesTable = process.env.TODO_IMAGES_TABLE
const bucketName = process.env.IMAGES_S3_BUCKET
const urlExpiration = process.env.SIGNED_URL_EXPIRATION

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Caller event' + event)
  const todoId = event.pathParameters.todoId
  const authorization = event.headers.Authorization
  const split = authorization.split(' ')
  const jwtToken = split[1]
  const userId = parseUserId(jwtToken)
  const validTodoId = await todoExists(todoId,userId)

  if (!validTodoId) {
    return {
      statusCode: 404,
      body: JSON.stringify({
        error: 'Todo does not exist'
      })
    }
  }

  const imageId = uuid.v4()
  const newItem = await createImage(todoId, imageId, event)
  const url = GenerateUploadUrl(imageId)
  console.log(url)

  await updateTodoAttachmentUrl(userId, todoId, newItem.imageUrl)

  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    },
    body: JSON.stringify({
      item: newItem,
      uploadUrl: url
    })
  }
})

handler.use(
  cors({
    credentials: true
  })
)

async function todoExists(todoId: string, userId: string) {
  const result = await docClient
    .get({
      TableName: todosTable,
      Key: {
        userId: userId,
        todoId: todoId
      }              
    })
    .promise()

  console.log('Get todo: ', result)
  return !!result.Item
}

async function updateTodoAttachmentUrl(userId: string, todoId: string, attachmentUrl: string ) {

  await docClient.update({
      TableName: todosTable,
      Key: { 
              userId: userId, 
              todoId: todoId 
      },
      UpdateExpression: "set attachmentUrl = :a",
      ExpressionAttributeValues: {
          ":a": attachmentUrl
      },
      ReturnValues: 'ALL_NEW'             

  }).promise()

  return 
}

async function createImage(todoId: string, imageId: string, event: any) {

  const timestamp = new Date().toISOString()
  const newImage = event

  const newItem = {
    todoId,
    timestamp,
    imageId,
    ...newImage,
    imageUrl: `https://${bucketName}.s3.amazonaws.com/${imageId}`
  }
  console.log('Storing new item: ', newItem)

  await docClient
    .put({
      TableName: imagesTable,
      Item: newItem
    })
    .promise()

  return newItem
}

function GenerateUploadUrl(imageId: string) {
  return s3.getSignedUrl('putObject', {
    Bucket: bucketName,
    Key: imageId,
    Expires: parseInt(urlExpiration)
  })
}