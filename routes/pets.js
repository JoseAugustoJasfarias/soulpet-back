const Cliente = require("../database/cliente");
const Pet = require("../database/pet");

const { Router } = require("express");
const Joi = require('joi');

// Criar o grupo de rotas (/pets)
const router = Router();

router.get("/pets", async (req, res) => {
  const listaPets = await Pet.findAll();
  res.json(listaPets);
});

router.get("/pets/:id", async (req, res) => {
  const { id } = req.params;

  const pet = await Pet.findByPk(id);
  if (pet) {
    res.json(pet);
  } else {
    res.status(404).json({ message: "Pet não encontrado." });
  }
});

const petSchema = Joi.object({
  nome: Joi.string().required().messages({
    'any.required': 'O campo "nome" é obrigatório.',
    'string.empty': 'O campo "nome" não pode ser vazio.',
    'string.base': 'O campo "nome" não pode ser númerico. ',
  }),
  tipo: Joi.string().required().messages({
    'any.required': 'O campo "tipo" é obrigatório.',
    'string.empty': 'O campo "tipo" não pode ser vazio.',
    'string.base': 'O campo "tipo" não pode ser númerico. ',
  }),
  porte: Joi.string().required().messages({
    'any.required': 'O campo "porte" é obrigatório.',
    'string.empty': 'O campo "porte" não pode ser vazio.',
    'string.base': 'O campo "porte" não pode ser númerico. ',
  }),
  dataNasc: Joi.date().optional(),
  clienteId: Joi.number().integer().positive().required().messages({
    'any.required': 'O campo "clienteId" é obrigatório.',
    'string.empty': 'O campo "clienteId" não pode ser vazio.',
    'number.base': 'O campo "clienteId" deve ser um número inteiro positivo.',
    
  }),
});

function formatErrorMessage(error) {
  const messages = {};
  error.details.forEach(detail => {
    const key = detail.context.key;
    const message = detail.message.replace(/"/g, '');
    messages[key] = message.charAt(0).toUpperCase() + message.slice(1);
  });
  return messages;
}

router.post("/pets", async (req, res) => {
  const { nome, tipo, porte, dataNasc, clienteId } = req.body;

  try {
    // Validar o corpo da requisição
    const { error } = petSchema.validate(req.body, { abortEarly: false });

    if (error) {
      const messages = formatErrorMessage(error);
      return res.status(400).json({ message: messages });
    }

    const cliente = await Cliente.findByPk(clienteId);
    if (cliente) {
      const pet = await Pet.create({ nome, tipo, porte, dataNasc, clienteId });
      res.status(201).json(pet);
    } else {
      res.status(404).json({ message: "Cliente não encontrado." });
    }
  } catch (err) {
    if (err.name === "SequelizeValidationError") {
      res.status(400).json(JSON.parse(err.message));
    } else {
      console.log(err);
      res.status(500).json({ message: "Um erro aconteceu." });
    }
  }
});



router.put("/pets/:id", async (req, res) => {
  // Esses são os dados que virão no corpo JSON
  const { nome, tipo, dataNasc, porte } = req.body;

  // É necessário checar a existência do Pet
  // SELECT * FROM pets WHERE id = "req.params.id";
  const pet = await Pet.findByPk(req.params.id);

  // se pet é null => não existe o pet com o id
  try {
    if (pet) {
      // IMPORTANTE: Indicar qual o pet a ser atualizado
      // 1º Arg: Dados novos, 2º Arg: Where
      await Pet.update(
        { nome, tipo, dataNasc, porte },
        { where: { id: req.params.id } } // WHERE id = "req.params.id"
      );
      // await pet.update({ nome, tipo, dataNasc, porte });
      res.json({ message: "O pet foi editado." });
    } else {
      // caso o id seja inválido, a resposta ao cliente será essa
      res.status(404).json({ message: "O pet não foi encontrado." });
    }
  } catch (err) {
    // caso algum erro inesperado, a resposta ao cliente será essa
    console.log(err);
    res.status(500).json({ message: "Um erro aconteceu." });
  }
});

router.delete("/pets/:id", async (req, res) => {
  // Precisamos checar se o pet existe antes de apagar
  const pet = await Pet.findByPk(req.params.id);

  try {
    if (pet) {
      // pet existe, podemos apagar
      await pet.destroy();
      res.json({ message: "O pet foi removido." });
    } else {
      res.status(404).json({ message: "O pet não foi encontrado" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Um erro aconteceu." });
  }
});

module.exports = router;
