import React, { useState } from "react";
import ReactDOM from "react-dom";
import "./index.css";
import * as serviceWorker from "./serviceWorker";
import { ApolloProvider } from "@apollo/react-hooks";
import ApolloClient, { gql } from "apollo-boost";
import { useQuery, useMutation } from "@apollo/react-hooks";

type Todo = { id: number; text: string; completed: boolean };
type NewTodo = { id: number; text: string };
type New2do = { text: string };

const client = new ApolloClient({
  uri: "https://bez-to-do-list.herokuapp.com/v1/graphql"
});

// The query to retrieve list from graphql
const TODO_LIST = gql`
  query getTodo {
    todos(order_by: { completed: asc, id: desc }) {
      id
      completed
      text
    }
  }
`;

const UPDATE_COMPLETED = gql`
  mutation updateTodo($id: Int, $completed: Boolean) {
    update_todos(_set: { completed: $completed }, where: { id: { _eq: $id } }) {
      returning {
        completed
      }
    }
  }
`;

const DELETE_TODO = gql`
  mutation deleteTodo($id: Int) {
    delete_todos(where: { id: { _eq: $id } }) {
      affected_rows
    }
  }
`;

// Send query and get list. List error if fail.
function TodoList() {
  const [updateTodo] = useMutation(UPDATE_COMPLETED, {
    refetchQueries: ["getTodo"]
  });
  const { loading, error, data } = useQuery(TODO_LIST);

  const [deleteTodo] = useMutation(DELETE_TODO, {
    refetchQueries: ["getTodo"]
  });

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: </p>;

  return (
    <div className="todo-list">
      <ul>
        {data.todos.map((todo: Todo) => (
          <li
            key={todo.id}
            className={todo.completed ? "todo-completed" : ""}
            onClick={() =>
              updateTodo({
                variables: { id: todo.id, completed: !todo.completed }
              })
            }
          >
            <div>{todo.text}</div>

            <button
              className="deleteButton"
              type="button"
              onClick={() => deleteTodo({ variables: { id: todo.id } })}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

const NEW_TODO = gql`
  mutation newTodo($text: String!) {
    insert_todos(objects: { text: $text }) {
      returning {
        completed
        id
        text
      }
    }
  }
`;

function AddTodo() {
  const [text, setText] = useState("");

  const [newTodo, { error, data }] = useMutation(NEW_TODO, {
    refetchQueries: ["getTodo"]
  });

  return (
    <div>
      {error ? <p>Oh no! {error.message}</p> : null}
      {data && data.newTodo ? <p>Created!</p> : null}
      <form
        onSubmit={event => {
          event.preventDefault();
          newTodo({ variables: { text } });
        }}
      >
        <p>
          <input
            className="new-todo"
            name="text"
            placeholder="What needs to be done?"
            onChange={e => setText(e.target.value)}
            autoFocus={true}
          />
        </p>
      </form>
      <button className="addButton" type="submit">
        Add
      </button>
    </div>
  );
}

const App = () => (
  <ApolloProvider client={client}>
    <div className="page">
      <head>
        <link
          href="https://fonts.googleapis.com/css?family=Muli&display=swap"
          rel="stylesheet"
        />
      </head>
      <div className="App-header">
        <header>
          <h1>ToDo App</h1>
        </header>
      </div>
      <div className="todo">
        <AddTodo />
        <TodoList />
      </div>
    </div>
  </ApolloProvider>
);
ReactDOM.render(<App />, document.getElementById("root"));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
