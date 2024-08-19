const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'todoApplication.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/todos/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

const hasPriorityAndStatusProperties = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}

const hasPriorityProperty = requestQuery => {
  return requestQuery.priority !== undefined
}

const hasStatusProperty = requestQuery => {
  return requestQuery.status !== undefined
}

const hasCategoryAndpriority = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  )
}

const hasCategoryAndStatus = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  )
}

const hasSearchProperty = requestQuery => {
  return requestQuery.search_q !== undefined
}

const hasCategoryProperty = requestQuery => {
  return requestQuery.category !== undefined
}

const convertStateDbObjectToResponseObject = dbObject => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    category: dbObject.category,
    priority: dbObject.priority,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  }
}

app.get('/todos/', async (request, response) => {
  let data = null
  let getTodosQuery = ''
  const {search_q = '', priority, status, category} = request.query

  switch (true) {
    case hasPriorityAndStatusProperties(request.query): //if this is true then below query is taken in the code
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        if (
          status === 'TO DO' ||
          status === 'IN PROGRESS' ||
          status === 'DONE'
        ) {
          getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
         status = '${status}'  AND priority = '${priority}';`

          data = await db.all(getTodosQuery)
          response.send(
            data.map(eachItem =>
              convertStateDbObjectToResponseObject(eachItem),
            ),
          )
        } else {
          response.status(400)
          response.send('Invalid Todo Status')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break

    case hasCategoryAndStatus(request.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (
          status === 'TO DO' ||
          status === 'IN PROGRESS' ||
          status === 'DONE'
        ) {
          getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        category = '${category}'
        AND status = '${status}';`
          data = await db.all(getTodosQuery)
          response.send(
            data.map(eachItem =>
              convertStateDbObjectToResponseObject(eachItem),
            ),
          )
        } else {
          response.status(400)
          response.send('Invalid Todo Status')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break

    case hasCategoryAndpriority(request.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (
          priority === 'HIGH' ||
          priority === 'MEDIUM' ||
          priority === 'LOW'
        ) {
          getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        category='${category}'
        AND priority = '${priority}';`
          data = await db.all(getTodosQuery)
          response.send(
            data.map(eachItem =>
              convertStateDbObjectToResponseObject(eachItem),
            ),
          )
        } else {
          response.status(400)
          response.send('Invalid Todo Priority')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break

    case hasPriorityProperty(request.query):
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        priority = '${priority}';`
        data = await db.all(getTodosQuery)
        response.send(
          data.map(eachItem => convertStateDbObjectToResponseObject(eachItem)),
        )

        data = await db.all(getTodosQuery)
        response.send(
          data.map(eachItem => convertStateDbObjectToResponseObject(eachItem)),
        )
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }

      break

    case hasStatusProperty(request.query):
      if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
        getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        status='${status}';`
        data = await db.all(getTodosQuery)
        response.send(
          data.map(eachItem => convertStateDbObjectToResponseObject(eachItem)),
        )
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }

      break

    case hasSearchProperty(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'`
      data = await db.all(getTodosQuery)
      response.send(
        data.map(eachItem => convertStateDbObjectToResponseObject(eachItem)),
      )
      break

    case hasCategoryProperty(request.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        category LIKE '%${category}%'`
        data = await db.all(getTodosQuery)
        response.send(
          data.map(eachItem => convertStateDbObjectToResponseObject(eachItem)),
        )
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break

    default:
      getTodosQuery = ` SELECT   * FROM   todo ;`
      data = await db.all(getTodosQuery)
      response.send(
        data.map(eachItem => convertStateDbObjectToResponseObject(eachItem)),
      )
  }
})

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const gettodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE
      id = ${todoId};`
  const todo = await db.get(gettodoQuery)
  response.send(convertStateDbObjectToResponseObject(todo))
})
//API4
app.post('/todos/', async (request, response) => {
  let updatedColumn = ''
  const requestbody = request.body
  const {id, todo, priority, status, category, due_date} = requestbody
  if (priority === 'HIGH' || priority === 'LOW' || priority === 'MEDIUM') {
    if (status === 'TO DO' || status === 'IN PROGRESs' || status === 'DONE') {
      if (category === 'WORK' || category === 'HOME' || category === 'DONE') {
        if (isMatch(dueDate, 'yyyy-MM-dd')) {
          const postNewDate = format(new Date(dueDate), 'yyyy-MM-dd')
          const todoQuery = `
    INSERT INTO
      todo (id,todo,priority,status,category,due_date)
    VALUES
      (
         ${id},
        '${todo}',
        '${priority}',
        '${status}',
        '${category}',
        '${postNewDate}'
       
      );`

          await db.run(todoQuery)
          response.send('Todo Successfully Added')
        } else {
          response.status(400)
          response.send('Invalid Due Date')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
    }
  } else {
    response.status(400)
    response.send('Invalid Todo Priority')
  }
})

///API3
app.get('/agenda/', async (request, response) => {
  const {date} = request.query

  if (isMatch(date, 'yyyy-MM-dd')) {
    const newdate = format(new Date(date), 'yyyy-MM-dd')

    const gettodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE
      due_date = ${newdate};`
    const responseResult = await db.all(gettodoQuery)
    response.send(
      responseResult.map(eachItem =>
        convertStateDbObjectToResponseObject(eachItem),
      ),
    )
  } else {
    response.status(400)
    response.send('Invalid Due Date')
  }
})

app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  let updatedColumn = ''
  const requestbody = request.body
  console.log(requestbody)

  const previousTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`
  const previousTodo = await db.run(previousTodoQuery)
  const {
    todo = previousTodo.todo,
    status = previousTodo.status,
    priority = previousTodo.priority,
    category = previousTodo.category,
    dueDate = previousTodo.dueDate,
  } = request.body

  let updateQuery
  switch (true) {
    case requestbody.status !== undefined:
      if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
        updateQuery = ` UPDATE todo SET todo='${todo}',priority='${priority}',status='${status}',category='${category}',due_date='${dueDate}' WHERE id=${todoId};`
        await db.run(updateQuery)
        response.send('Status Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break

    // update priority
    case requestbody.priority !== undefined:
      if (priority === 'HIGH' || priority === 'LOW' || priority === 'MEDIUM') {
        updateQuery = ` UPDATE todo SET todo='${todo}',priority='${priority}',status='${status}',category='${category}',due_date='${dueDate}' WHERE id=${todoId}`
        await db.run(updateQuery)
        response.send('Priority Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break

    // todo

    case requestbody.todo !== undefined:
      updateQuery = ` UPDATE todo SET todo='${todo}',priority='${priority}',status='${status}',category='${category}',due_date='${dueDate}' WHERE id=${todoId}`
      await db.run(updateQuery)
      response.send('Todo Updated')

      break

    //update category

    case requestbody.category !== undefined:
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        updateQuery = ` UPDATE todo SET todo='${todo}',priority='${priority}',status='${status}',category='${category}',due_date='${dueDate}' WHERE id=${todoId}`
        await db.run(updateQuery)
        response.send('Category Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break

    // due Date

    case requestbody.dueDate !== undefined:
      if (isMatch(dueDate, 'yyyy-MM-dd')) {
        const newDate = format(new Date(dueDate), 'yyyy-MM-dd')

        updateQuery = ` UPDATE todo SET todo='${todo}',priority='${priority}',status='${status}',category='${category}',due_date='${newDate}' WHERE id=${todoId}`

        await db.run(updateQuery)
        response.send('Due Date Updated')
      } else {
        response.status(400)
        response.send('Invalid Due Date')
      }
      break
  }
})

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deletetodoQuery = `
    DELETE FROM
      todo
    WHERE
      id = ${todoId};`
  await db.run(deletetodoQuery)
  response.send('Todo Deleted')
})

module.exports = app
