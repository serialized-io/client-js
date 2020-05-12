var uuidv4 = require("uuid").v4;
var {AggregateRoot} = require("../../lib");

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

class TodoList extends AggregateRoot {

  constructor(todoListId) {
    super(todoListId, 'TodoList')
    this.status = 'NEW';
    this.todos = [];
  }

  /**
   * Business logic methods
   */

  addTodo(title, description) {
    if (this.status === 'NEW') {
      throw Error("Cannot add todos to new list.")
    } else {
      this.saveEvents([new TodoAddedEvent(title, description)]);
    }
  }


  /**
   * Handler methods for applying events to state
   */

  handleTodoListCreated(e) {
    console.log('Handling TodoListCreated')
    this.status = 'CREATED';
  }

  handleTodoListAdded(e) {
    console.log('Handling TodoListAdded')
    let todo = new Todo();
    this.todos.push()
  }
}

module.exports = {TodoCreatedEvent, TodoAddedEvent, TodoList}
module.exports.default = TodoList
