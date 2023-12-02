const express = require("express");
const sqlite3 = require("sqlite3");

const { open } = require("sqlite");
const path = require("path");
const dateTime = require("date-fns");

const dbPath = path.join(__dirname, "todoApplication.db");

const app = express();

app.use(express.json());

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB error : ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const hasDueDateProperty = (requestQuery) => {
  return requestQuery.due_date !== undefined;
};

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryAndPriorityProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

//API 1

app.get("/todos/", async (request, response) => {
  let data = null;
  const { status, priority, search_q = "", category, due_date } = request.query;
  let getTodoQuery = "";

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodoQuery = `
            SELECT 
            * 
            FROM 
            todo
            WHERE
            todo LIKE '%${search_q}%' 
            AND status = '${status}' 
            AND priority = '${priority}';`;
      break;

    case hasCategoryAndStatusProperties(request.query):
      getTodoQuery = `
            SELECT 
            * 
            FROM 
            todo
            WHERE
            todo LIKE '%${search_q}%' 
            AND status = '${status}' 
            AND category = '${category}';`;
      break;

    case hasCategoryAndPriorityProperties(request.query):
      getTodoQuery = `
            SELECT 
            * 
            FROM 
            todo
            WHERE
            todo LIKE '%${search_q}%' 
            AND priority = '${priority}'
            AND category = '${category}';`;
      break;

    case hasStatusProperty(request.query):
      try {
        getTodoQuery = `
                SELECT 
                * 
                FROM 
                todo
                WHERE
                todo LIKE '%${search_q}%' 
                AND status = '${status}';`;
      } catch (e) {
        response.status(400);
        response.send("Invalid Todo Status");
      }

      break;

    case hasPriorityProperty(request.query):
      try {
        getTodoQuery = `
                SELECT 
                * 
                FROM 
                todo
                WHERE
                todo LIKE '%${search_q}%' 
                AND priority = '${priority}';`;
      } catch (e) {
        response.status(400);
        response.send("Invalid Todo Priority");
      }

      break;

    case hasCategoryProperty(request.query):
      try {
        getTodoQuery = `
                SELECT 
                * 
                FROM 
                todo
                WHERE
                todo LIKE '%${search_q}%' 
                AND category = '${category}';`;
      } catch (e) {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    default:
      getTodoQuery = `
            SELECT 
            * 
            FROM 
            todo
            WHERE
            todo LIKE '%${search_q}%';`;
  }

  data = await db.all(getTodoQuery);
  response.send(data);
});

// API 2

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const getTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE
      id = ${todoId};`;
  const todo = await db.get(getTodoQuery);
  response.send(todo);
});

//API 4

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const postTodoQuery = `
  INSERT INTO
    todo (id, todo, priority, status, category, due_date )
  VALUES
    (${id}, '${todo}', '${priority}', '${status}', '${category}', '${dueDate}');`;
  await db.run(postTodoQuery);
  response.send("Todo Successfully Added");
});

//API 5

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
    case requestBody.category !== undefined:
      updateColumn = "Category";
      break;
    case requestBody.dueDate !== undefined:
      updateColumn = "Due Date";
      break;
  }
  const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE 
      id = ${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.due_date,
  } = request.body;

  const updateTodoQuery = `
    UPDATE
      todo
    SET
      todo='${todo}',
      priority='${priority}',
      status='${status}',
      category = '${category}',
      due_date = '${dueDate}'
    WHERE
      id = ${todoId};`;

  await db.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

//API 6

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};`;

  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
