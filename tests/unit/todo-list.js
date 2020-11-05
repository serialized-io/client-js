const uuidv4 = require("uuid").v4;

const TodoListStatus = {
  CREATED: 'CREATED',
};

class TodoListCreated {
}

class TodoListAdded {
}

class TodoCreatedEvent {
}

class TodoAddedEvent {

  constructor(title, description) {
    this.eventId = uuidv4();
    this.eventType = TodoAddedEvent.name;
    this.title = title;
    this.description = description;

  }
}

class Todo {
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
      return [new TodoAddedEvent(title, description)];
    }
  }

  get initialState() {
    return new TodoListState();
  }

  // Defines event handlers for state creation
  get eventHandlers() {
    return {
      TodoListCreated(state) {
        if (!state.todos) {
          throw new Error('Initial state invalid');
        }
        const newState = Object.assign({}, state);
        newState.status = TodoListStatus.CREATED;
        console.log('Handling TodoListCreated', newState)
        return newState;
      },

      TodoListAdded(state, event) {
        console.log('Handling TodoListAdded')
        const newState = Object.assign({}, state);
        newState.todos.push(event)
        return newState;
      }
    }
  }


}

module.exports = {TodoCreatedEvent, TodoAddedEvent, TodoList}
module.exports.default = TodoList
