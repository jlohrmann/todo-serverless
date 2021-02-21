import * as uuid from 'uuid'

import { TodoItem } from '../models/TodoItem'
import { TodoAccess } from '../dataLayer/todoAccess'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { parseUserId } from '../auth/utils'

const todoAccess = new TodoAccess()

export async function getAllTodos(userId: string): Promise<TodoItem[]> {
  return todoAccess.getAllTodos(userId)
}

export async function createTodo(
  createTodoRequest: CreateTodoRequest, 
  jwtToken: string
): Promise<TodoItem> {

  const todoId = uuid.v4()
  const userId = parseUserId(jwtToken)

  return await todoAccess.createTodo({
    todoId: todoId,
    userId: userId,
    createdAt: new Date().toISOString(),
    name: createTodoRequest.name,
    dueDate: createTodoRequest.dueDate,
    done: false,
    attachmentUrl: '',
    timestamp: new Date().toISOString()
  })
}

export async function updateTodo(
  updateTodoRequest: UpdateTodoRequest,
  updateTodoId: string,
  jwtToken: string
): Promise<TodoItem> {
  
  const userId = parseUserId(jwtToken)

  return await todoAccess.updateTodo({
    userId: userId,
    todoId: updateTodoId,
    createdAt: new Date().toISOString(),
    name: updateTodoRequest.name,
    dueDate: updateTodoRequest.dueDate,
    done: true,
    attachmentUrl: '',
    timestamp: new Date().toISOString()
  })
}

export async function deleteTodo(
  deleteTodoId: string,
  jwtToken: string
): Promise<String> {
  
  const userId = parseUserId(jwtToken)

  return await todoAccess.deleteTodo(userId, deleteTodoId)
}

