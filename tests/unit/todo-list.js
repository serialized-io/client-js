const uuidv4 = require("uuid").v4;

const TodoListStatus = {
  CREATED: 'CREATED',
};

class TodoListCreated {
  constructor(todoListId) {
    this.todoListId = todoListId;
    this.name = name;
  }

}

class TodoListAdded {
  constructor(title) {
    this.title = title;
  }

}

class TodoAdded {

  constructor(title, description) {
    this.title = title;
    this.description = description;
  }
}

class TodoListState {
  constructor() {
    this.todos = [];
  }
}

class TodoList {

  constructor(state) {
    this.state = state;
    this.aggregateType = 'todo-list'
  }

  /**
   * Business logic methods
   */
  addTodo(title, description) {
    if (this.status === 'NEW') {
      throw Error("Cannot add todos to new list.")
    } else {
      return [new TodoAdded(title, description)];
    }
  }

  get initialState() {
    return new TodoListState();
  }

  // Defines event handlers for state creation
  get eventHandlers() {
    return {
      TodoListCreated(state, event) {
        console.log('Handling TodoListCreated', state, event)
        const newState = Object.assign({}, state);
        newState.todoListId = event.todoListId;
        newState.status = TodoListStatus.CREATED;
        newState.todos = [];
        console.log('Handling TodoListCreated', newState)
        return newState;
      },

      TodoListAdded(state, event) {
        console.log('Handling TodoListAdded', state, event)
        const newState = Object.assign({}, state);
        newState.todos.push(event)
        return newState;
      }
    }
  }


}

module.exports = {TodoListAdded, TodoListCreated, TodoAddedEvent: TodoAdded, TodoList}
module.exports.default = TodoList
