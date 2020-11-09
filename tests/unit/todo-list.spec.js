const uuidv4 = require("uuid").v4;
const {Serialized, EventEnvelope} = require("../../lib/");
const {randomKeyConfig, mockClient, mockGetOk, mockPostOk} = require("./client-helpers");
const {TodoList, TodoListCreated, TodoListAdded} = require("./todo-list");

describe('Todo list test', () => {

  it('Can load a full aggregate from JS', async () => {
    const todoClient = Serialized.create(randomKeyConfig()).aggregateClient(TodoList);

    const todoListId = uuidv4();
    const aggregateType = 'todo-list';
    const expectedResponse = {
      aggregateVersion: 1,
      aggregateType: aggregateType,
      aggregateId: todoListId,
      events: [
        new EventEnvelope(new TodoListCreated(todoListId)),
        new EventEnvelope(new TodoListAdded('Buy milk'))
      ],
      hasMore: false,
    };
    mockClient(
        todoClient.axiosClient,
        [
          mockGetOk(RegExp(`^\/aggregates/${aggregateType}/${todoListId}$`), expectedResponse),
          mockPostOk(RegExp(`^\/aggregates/${aggregateType}/${todoListId}/events$`), expectedResponse)
        ]);

    const todoList = await todoClient.load(todoListId);
    const newEvents = todoList.addTodo('new-todo', 'hello');

    expect(newEvents.length).toStrictEqual(1);
    expect(todoList._metadata.version).toStrictEqual(1);
    expect(todoList.state.todos[0].title).toStrictEqual('Buy milk');

  });

})
