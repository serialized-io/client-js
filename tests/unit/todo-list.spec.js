const nock = require("nock");
const uuidv4 = require("uuid").v4;
const {Serialized, DomainEvent, AggregatesClient} = require("../../lib/");
const {randomKeyConfig, mockSerializedApiCalls} = require("./client-helpers");
const {TodoList, TodoListCreated, TodoListAdded} = require("./todo-list");

describe('Todo list test', () => {

  it('Can load a full aggregate from JS', async () => {
    const config = randomKeyConfig();
    const todoClient = Serialized.create(config).aggregateClient(TodoList);

    const todoListId = uuidv4();
    const aggregateType = 'todo-list';
    const expectedResponse = {
      aggregateVersion: 1,
      aggregateType: aggregateType,
      aggregateId: todoListId,
      events: [
        new DomainEvent(new TodoListCreated(todoListId, 'Shopping list')),
        new DomainEvent(new TodoListAdded('Buy milk'))
      ],
      hasMore: false,
    };

    mockSerializedApiCalls(config)
      .get(AggregatesClient.aggregateUrlPath(aggregateType, todoListId))
      .query({since: '0', limit: '1000'})
      .reply(200, expectedResponse)
      .get(AggregatesClient.aggregateUrlPath(aggregateType, todoListId))
      .reply(401);

    const todoList = await todoClient.load(todoListId);
    const newEvents = todoList.addTodo('new-todo', 'hello');

    expect(newEvents.length).toStrictEqual(1);
    expect(todoList._metadata.version).toStrictEqual(1);
    expect(todoList.state.todos[0].title).toStrictEqual('Buy milk');

  });

})
