const { z } = require('zod');

const schemas = {
  addItemSchema: z.object({
    name: z.string().min(1, { message: "Por favor, informe a descrição da tarefa." }),
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