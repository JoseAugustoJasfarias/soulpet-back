const Servico = require("../database/servico");
const { Router } = require("express");

const router = Router();

const Joi = require("joi");

const sertvicoSchema = Joi.object({
  nome: Joi.string().required().messages({
    "any.required": 'O campo "nome" é obrigatório.',
    "string.base": 'O campo "nome" não pode ser númerico. ',
    "string.max": 'O campo "nome" não pode ser mairo que 130 caracteres. ',
    "string.empty": 'O campo "nome" não pode ser vazio.',
  }),
  preco: Joi.number().min(0).required().messages({
    "number.base": 'O campo "preço" deve ser um número.',
    "number.min": 'O campo "preço" deve ser um número maior ou igual a 0.',
    "any.required": 'O campo "preço" é obrigatório.',
    "string.empty": 'O campo "preço" não pode ser vazio.',
  }),
});

function formatErrorMessage(error) {
  const messages = error.details.map((detail) => {
    const message = detail.message.replace(/"/g, "");
    return message.charAt(0).toUpperCase() + message.slice(1);
  });

  return messages;
}

router.get("/servicos", async (req, res) => {
  const listarServicos = await Servico.findAll();
  res.json(listarServicos);
});

router.get("/servico/:id", async (req, res) => {
  const { id } = req.params;

  const servico = await Servico.findByPk(id);
  if (servico) {
    res.json(servico);
  } else {
    res.status(404).json({ message: "Servico não encontrado." });
  }
});

router.post("/servico", async (req, res) => {
  const { error, value } = sertvicoSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    const messages = formatErrorMessage(error);
    return res.status(400).json({ message: messages });
  }

  try {
    const novoServico = await Servico.create({
      nome: value.nome,
      preco: value.preco,
    });
    res.status(201).json(novoServico);
  } catch (err) {
    console.error(err);
    if (err.name === "SequelizeValidationError") {
      res.status(400).json({ message: "Dados inválidos." });
    } else {
      res.status(500).json({ message: "Ocorreu um erro." });
    }
  }
});

router.put("/servico/:id", async (req, res) => {
  const { nome, preco } = req.body;

  const servico = await Servico.findByPk(req.params.id);

  try {
    if (servico) {
      await Servico.update({ nome, preco }, { where: { id: req.params.id } });
      res.json({ message: "O serviço foi editado.", servico });
    } else {
      res.status(404).json({ message: "O serviço não foi encontrado." });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Um erro aconteceu." });
  }
});

router.delete("/servico/:id", async (req, res) => {
  const servico = await Servico.findByPk(req.params.id);

  try {
    if (servico) {
      await servico.destroy();
      res.json({ message: "O serviço foi removido.", servico });
    } else {
      res.status(404).json({ message: "O serviço não foi encontrado" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Um erro aconteceu." });
  }
});

router.delete("/servicos/deleteAll", async (req, res) => {
  try {
    await Servico.destroy({ where: {} });
    res.json({ message: "Todos os serviços foram removidos." });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Um erro aconteceu." });
  }
});

module.exports = router;
