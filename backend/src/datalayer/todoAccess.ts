import * as AWS from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { TodoItem } from '../models/TodoItem'
import { createLogger } from '../utils/logger'
const logger = createLogger('auth')


export class TodoAccess {

    constructor(
        private readonly docClient: DocumentClient = createDynamoDBClient(),
        private readonly todosTable = process.env.TODOS_TABLE) {
    }

    async getAllTodos(userid: string): Promise<TodoItem[]> {

        try {
            const result = await this.docClient.query({
                TableName: this.todosTable,
                KeyConditionExpression: 'userId = :userId',
                ExpressionAttributeValues: {
                    ':userId': userid
                }                
            }).promise()
            const items = result.Items
            logger.info('Retrieving all todos', {
                resultItems: items
              })
            
            return items as TodoItem[]
        }
        catch ( err ){

            console.log(' Error getting all todos: ' + err )
            
        }

    }

    async createTodo(todo: TodoItem): Promise<TodoItem> {

        await this.docClient.put({
            TableName: this.todosTable,
            Item: todo
        }).promise()

        logger.info('Creating new todo', {
            newTodo: todo
          })
        return todo

    }

    async updateTodo(todo: TodoItem): Promise<TodoItem> {
        
        await this.docClient.update({
            TableName: this.todosTable,
            Key: { 
                    userId: todo.userId, 
                    todoId: todo.todoId 
            },
            UpdateExpression: "set #name = :a, done = :b, dueDate = :c",
            ExpressionAttributeNames: {'#name' : 'name'},
            ExpressionAttributeValues: {
                ":a": todo.name,
                ":b": todo.done,
                ":c": todo.dueDate
            },
            ReturnValues: 'ALL_NEW'             

        }).promise()

        logger.info('Updating a todo', {
            updatedItem: todo
          })

        return todo
    }



    async deleteTodo(userId: string, todoId: string) {
        
        const result = await this.docClient.delete({
            TableName: this.todosTable,
            Key: {
                "userId": userId,
                "todoId": todoId
            },
            ReturnValues: 'ALL_OLD'             
        }).promise()

        logger.info('Delete a todo', {
            deletedTodo: result
          })

        return todoId
    }
    
}

function createDynamoDBClient() {
    if (process.env.IS_OFFLINE) {
        console.log('Creating a local DynamoDB instance')
        return new AWS.DynamoDB.DocumentClient({
            region: 'localhost',
            endpoint: 'http://localhost:8000'
        })
    }

    return new AWS.DynamoDB.DocumentClient()
}