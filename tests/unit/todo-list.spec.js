const uuidv4 = require("uuid").v4;
const {Serialized} = require("../../lib/index");
const {mockClient, mockGetOk, mockPostOk} = require("./client-helpers");
const {TodoList} = require("./todo-list");

function randomKeyConfig() {
  return {accessKey: uuidv4(), secretAccessKey: uuidv4()};
}

describe('Todo list test', () => {

  it('Can load a full aggregate', async () => {

    console.log('Serialized', Serialized);

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

  it('Can load a single projection', async () => {

    const serializedInstance = Serialized.create(randomKeyConfig())
    const projectionName = 'Todo';
    const projectionId = uuidv4();
    const expectedResponse = {
      createdAt: 0,
      updatedAt: 0,
      projectionId: projectionId,
      data: {
        title: 'Buy milk',
        completed: false,
      }
    };


    mockClient(
        serializedInstance.axiosClient,
        [
          mockGetOk(RegExp(`^\/projections/single/${projectionName}/${projectionId}$`), expectedResponse),
        ]);
    const response = await serializedInstance.projections.getSingleProjection({projectionName, projectionId});

    expect(response.data).toStrictEqual({
      title: 'Buy milk',
      completed: false,
    })
  });

  it('Can load a projection definition', async () => {

    const serializedInstance = Serialized.create(randomKeyConfig())

    const projectionName = 'Todo';
    const expectedResponse = {
      feedName: 'todo-lists',
      projectionName: 'todo-list-summaries',
      handlers: [
        {
          eventType: 'TodoAddedEvent',
          functions: [
            {
              function: 'merge',
            }
          ],
        }
      ]
    };

    mockClient(
        serializedInstance.axiosClient,
        [
          mockGetOk(RegExp(`^\/projections/definitions/${projectionName}$`), expectedResponse),
        ]);

    const response = await serializedInstance.projections.getProjectionDefinition(projectionName);

    expect(response.projectionName).toStrictEqual('todo-list-summaries')
  });

})
