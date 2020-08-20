const uuidv4 = require("uuid").v4;
const {Serialized} = require("../../lib/index");
const {mockClient, mockGetOk, mockPostOk} = require("./client-helpers");
const {TodoList} = require("./todo-list");

function randomKeyConfig() {
  return {accessKey: uuidv4(), secretAccessKey: uuidv4()};
}

describe('Todo list test', () => {

  it('Can load a full aggregate', async () => {
    const serializedInstance = Serialized.create(randomKeyConfig())
    const aggregateType = 'TodoList';
    const aggregateId = uuidv4();
    const expectedResponse = {
      aggregateVersion: 1,
      aggregateType: aggregateType,
      aggregateId: aggregateId,
      events: [
        {
          eventId: uuidv4(),
          eventType: 'TodoListCreated',
        }
      ],
      hasMore: false,
    };
    mockClient(
        serializedInstance.axiosClient,
        [
          mockGetOk(RegExp(`^\/aggregates/${aggregateType}/${aggregateId}$`), expectedResponse),
          mockPostOk(RegExp(`^\/aggregates/${aggregateType}/${aggregateId}/events$`), expectedResponse)
        ]);

    let todoList = new TodoList(aggregateId);
    await serializedInstance.aggregates.load(todoList);
    todoList.addTodo('A new todo', 'Some more info here');
    await serializedInstance.aggregates.save(todoList);
  });

})
