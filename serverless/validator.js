const { z } = require('zod');

const schemas = {
  addItemSchema: z.object({
    name: z.string().min(1, { message: "Por favor, informe a descrição da tarefa." }),
  }),
  updateItemSchema: z.object({
    id: z.number().int({ message: "O id deve ser um número inteiro." }),
    name: z.string().min(1, { message: "Por favor, informe a descrição da tarefa." }),
  }),
  deleteItemSchema: z.object({
    id: z.number().int({ message: "O id deve ser um número inteiro." }),
  }),
  todoListFilterSchema: z.object({
    name: z.string().min(1, { message: "Por favor, informe o termo a ser pesquisado." }),
  }),
};

const validate = (schemaName, data) => {
  try {
    schemas[schemaName].parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`${error.errors.map(e => e.message).join(", ")}`);
    }
    throw error;
  }
}

module.exports = {
  validate,
};