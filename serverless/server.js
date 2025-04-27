const { ApolloServer } = require("@apollo/server");
const { startStandaloneServer } = require("@apollo/server/standalone");
const { TODO_LIST } = require("./makeData");
const { validate } = require("./validator");

/**
 * Gera um número inteiro para utilizar de id
 */
function getRandomInt() {
  return Math.floor(Math.random() * 999);
}

const typeDefs = `#graphql
  type Item {
    id: Int
    name: String
  }

  input ItemInput {
    id: Int
    name: String
  }

  input ItemFilter {
    id: Int
    name: String
  }

  type Query {
    todoList(filter: ItemFilter): [Item]
  }

  type Mutation {
    addItem(values: ItemInput): Boolean
    updateItem(values: ItemInput): Boolean
    deleteItem(id: Int!): Boolean
  }
`;

const resolvers = {
  Query: {
    todoList: (_, { filter }) => {
      if (filter?.name) {
        validate('todoListFilterSchema', filter);
        return TODO_LIST.filter((item) =>
          item.name.toLowerCase().includes(filter.name.toLowerCase())
        );
      }

      return TODO_LIST;
    },
  },
  Mutation: {
    addItem: (_, { values: { name } }) => {
      validate('addItemSchema', { name });

      if (TODO_LIST.some((item) => item.name === name)) {
        throw new Error("Ops! Parece que essa tarefa já está na sua lista. Que tal adicionar uma nova?");
      }

      TODO_LIST.push({
        id: getRandomInt(),
        name,
      });
    },
    updateItem: (_, { values: { id, name } }) => {
      validate('updateItemSchema', { id, name });

      if (TODO_LIST.some((item) => item.id != id && item.name === name)) {
        throw new Error("Já existe uma outra tarefa com a descrição informada.");
      }

      const itemIndex = TODO_LIST.findIndex((item) => item.id == id);
      if (itemIndex >= 0) {
        TODO_LIST[itemIndex] = { id, name };
      }
    },
    deleteItem: (_, { id }) => {
      validate('deleteItemSchema', { id });

      const itemIndex = TODO_LIST.findIndex((item) => item.id == id);
      if (itemIndex >= 0) {
        TODO_LIST.splice(itemIndex, 1);
      }
    },
  },
};

// Configuração para subir o backend
const startServer = async () => {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 },
  });

  console.log(`🚀  Server ready at: ${url}`);
};

startServer();
