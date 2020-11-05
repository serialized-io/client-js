const uuidv4 = require("uuid").v4;
const {Serialized} = require("../../lib/index");
const {randomKeyConfig, mockClient, mockGetOk, mockPostOk} = require("./client-helpers");
const {TodoList} = require("./todo-list");

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
        {
          eventId: uuidv4(),
          eventType: 'TodoListCreated',
        }
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

  });

})
