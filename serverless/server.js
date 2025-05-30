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
    completed: Boolean 
    order: Int
  }

  input ItemInput {
    id: Int
    name: String
  }

  input ItemFilter {
    id: Int
    name: String
  }

  input ReorderItemInput {
    id: Int
    order: Int
  }

  type Query {
    todoList(filter: ItemFilter): [Item]
  }

  type Mutation {
    addItem(values: ItemInput): Boolean
    updateItem(values: ItemInput): Boolean
    deleteItem(id: Int!): Boolean
    completeItem(id: Int!): Boolean
    reorderItem(values: ReorderItemInput): Boolean
  }
`;

const resolvers = {
  Query: {
    /**
     * Retorna a lista de tarefas, podendo ser filtrada pelo nome.
     * 
     * @param {object} _ - Contexto (não utilizado).
     * @param {object} params - Parâmetros da query.
     * @param {object} params.filter - Filtro opcional.
     * @param {string} params.filter.name - Nome para filtrar as tarefas (case insensitive).
     * @returns {Array} Lista de tarefas filtradas ou completas.
     */
    todoList: (_, { filter }) => {
      if (filter?.name) {
        validate('todoListFilterSchema', filter);
        return TODO_LIST.filter((item) =>
          item.name.toLowerCase().includes(filter.name.toLowerCase())
        );
      }

      TODO_LIST.sort((a, b) => a.order - b.order);

      return TODO_LIST;
    },
  },
  Mutation: {
    /**
     * Adiciona uma nova tarefa na lista. Valida se já
     * existe uma tarefa com o "name" informado.
     * 
     * @param {object} _ - Contexto (não utilizado).
     * @param {object} params - Parâmetros da mutation.
     * @param {object} params.values - Valores enviados para a criação.
     * @param {string} params.values.name - Nome da tarefa a ser adicionada.
     * @throws {Error} Se já existir uma tarefa com o mesmo nome.
     * @returns {boolean} Retorna `true` se o item foi adicionado com sucesso.
     */
    addItem: (_, { values: { name } }) => {
      validate('addItemSchema', { name });

      if (TODO_LIST.some((item) => item.name === name)) {
        throw new Error("Ops! Parece que essa tarefa já está na sua lista. Que tal adicionar uma nova?");
      }

      TODO_LIST.push({
        id: getRandomInt(),
        name,
        completed: false,
        order: TODO_LIST.length + 1,
      });

      return true;
    },
    /**
     * Atualiza uma tarefa existente na lista. Valida se
     * o nome informado não conflita com outro nome
     * existente na lista
     * 
     * @param {object} _ - Contexto (não utilizado).
     * @param {object} params - Parâmetros da mutation.
     * @param {object} params.values - Valores enviados para atualização.
     * @param {number} params.values.id - ID da tarefa a ser atualizada.
     * @param {string} params.values.name - Novo nome para a tarefa.
     * @throws {Error} Se existir outra tarefa com o mesmo nome.
     * @returns {boolean} Retorna `true` se o item foi atualizado com sucesso.
     * @throws {Error} Lança um erro se o item não for encontrado.
     */
    updateItem: (_, { values: { id, name } }) => {
      validate('updateItemSchema', { id, name });

      if (TODO_LIST.some((item) => item.id != id && item.name === name)) {
        throw new Error("Já existe uma outra tarefa com a descrição informada.");
      }

      const itemIndex = TODO_LIST.findIndex((item) => item.id == id);
      if (itemIndex >= 0) {
        TODO_LIST[itemIndex] = { ...TODO_LIST[itemIndex], name };
        return true;
      }

      throw new Error('Item não encontrado.');
    },
    /**
     * Remove uma tarefa da lista pelo ID.
     * 
     * Valida o ID recebido, busca o item na lista e remove-o caso exista.
     * Caso o item não seja encontrado, lança um erro.
     * 
     * @param {object} _ - Contexto da GraphQL (não utilizado).
     * @param {object} params - Parâmetros recebidos na mutation.
     * @param {number} params.id - ID da tarefa que deve ser removida.
     * @returns {boolean} Retorna `true` se o item foi removido com sucesso.
     * @throws {Error} Lança um erro se o item não for encontrado.
     */
    deleteItem: (_, { id }) => {
      validate('deleteItemSchema', { id });

      const itemIndex = TODO_LIST.findIndex((item) => item.id == id);
      if (itemIndex >= 0) {
        TODO_LIST.splice(itemIndex, 1);

        return true;
      }

      throw new Error('Item não encontrado.');
    },
    /**
     * Executa o toggle do status da tarefa pelo ID.
     * 
     * Valida o ID recebido, localiza o item na lista e atualiza seu status. 
     * Se o item não for encontrado, lança um erro.
     * 
     * @param {object} _ - Contexto do GraphQL (não utilizado).
     * @param {object} params - Parâmetros recebidos na mutation.
     * @param {object} params.values - Objeto contendo o ID da tarefa.
     * @param {number} params.values.id - ID da tarefa a ser marcada como concluída.
     * @returns {boolean} Retorna `true` se a tarefa foi marcada com sucesso.
     * @throws {Error} Lança um erro se o item não for encontrado na lista.
     */
    completeItem: (_, { id }) => {
      validate('completeItemSchema', { id });

      const itemIndex = TODO_LIST.findIndex((item) => item.id == id);
      if (itemIndex >= 0) {
        TODO_LIST[itemIndex].completed = !TODO_LIST[itemIndex].completed;
        return true;
      }

      throw new Error('Item não encontrado.');
    },
    /**
     * Reordena uma tarefa na lista com base no ID e na nova ordem.
     * 
     * Valida o ID e a nova ordem recebidos, localiza o item na lista e ajusta
     * a ordem dos demais itens conforme necessário. Caso o item não seja encontrado,
     * lança um erro.
     * 
     * @param {object} _ - Contexto do GraphQL (não utilizado).
     * @param {object} params - Parâmetros recebidos na mutation.
     * @param {object} params.values - Objeto contendo os valores para reordenação.
     * @param {number} params.values.id - ID da tarefa a ser reordenada.
     * @param {number} params.values.order - Nova posição da tarefa na lista.
     * @returns {boolean} Retorna `true` se a tarefa foi reordenada com sucesso.
     * @throws {Error} Lança um erro se o item não for encontrado na lista.
     */
    reorderItem: (_, { values: { id, order } }) => {
      validate('reorderItemSchema', { id, order });

      const itemIndex = TODO_LIST.findIndex((item) => item.id == id);
      if (itemIndex >= 0) {
        const [movedItem] = TODO_LIST.splice(itemIndex, 1);

        if (movedItem.order > order) {
          TODO_LIST.forEach((item) => {
            if (item.order >= order && item.order < movedItem.order) {
              item.order += 1;
            }
          });
        } else {
          TODO_LIST.forEach((item) => {
            if (item.order <= order && item.order > movedItem.order) {
              item.order -= 1;
            }
          });
        }

        movedItem.order = order;
        TODO_LIST.push(movedItem);
        TODO_LIST.sort((a, b) => a.order - b.order);
        return true;
      }

      throw new Error('Item não encontrado.');
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
