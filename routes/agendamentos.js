const Agendamento = require("../database/agendamento");
const { Router } = require("express");
const Servico = require("../database/servico");
const Pet = require("../database/pet");
const Joi = require("joi");
// Criar o grupo de rotas
const router = Router();
const express = require("express");

// Definição de rotas
// GET
router.get("/agendamentos", async (req, res) => {
  const agendamentos = await Agendamento.findAll();
  res.json(agendamentos);
});

const agendamentoSchema = Joi.object({
  dataAgendada: Joi.date().required(),
  realizado: Joi.boolean().required(),
  petId: Joi.number().integer().positive().required(),
  servicoId: Joi.number().integer().positive().required(),
});

function formatErrorMessage(error) {
  const messages = error.details.map((detail) => {
    let message = detail.message.replace(/"/g, "");
    message = message.charAt(0).toUpperCase() + message.slice(1);
    message = message.replace("is required", "é obrigatório");
    message = message.replace("not allowed", "não permitido");
    message = message.replace("must be a number", "deve ser um número");
    message = message.replace("must be a boolean", "deve ser um true ou false");
    message = message.replace(
      "must be a valid date",
      " deve ser uma data futura , data válida entre aspas no formato ANO/MES/DIA."
    );
    message = message.replace("invalid", "inválido");
    message = message.replace("_id", "");
    message = message.replace("is não permitido", "não permitido");
    message = message.replace(/\[.+?\]\./g, ""); // Remove o [0].
    message = message.replace(/\\+/g, ""); // Remove todas as barras invertidas consecutivas.
    return message;
  });
  return messages.join(", ");
}

// POST
router.post("/agendamentos", async (req, res) => {
  const { agendamento } = req.body;

  if (!agendamento) {
    return res.status(400).json({
      message: "O corpo da requisição deve conter pelo menos um agendamento.",
      example: {
        agendamento: [
          {
            servicoId: "numeroID",
            realizado: "statusAgendamento",
            dataAgendada: "data no formato entre aspas ANO/MES/DIA",
            petId: "numeroIDPet",
          },
        ],
      },
    });
  }

  if (!Array.isArray(agendamento) || agendamento.length === 0) {
    return res.status(400).json({
      message:
        'A propriedade "agendamento" deve ser um array com pelo menos um objeto.',
    });
  }

  const { error } = Joi.array()
    .items(agendamentoSchema)
    .validate(agendamento, { abortEarly: false });

  if (error) {
    const formattedError = formatErrorMessage(error);
    return res.status(400).json({ message: formattedError });
  }

  try {
    for (const item of agendamento) {
      const { servicoId, realizado, dataAgendada, petId } = item;
      const pet = await Pet.findByPk(petId);
      const servico = await Servico.findByPk(servicoId);

      if (!pet) {
        return res
          .status(404)
          .json({ message: `Pet com ID ${petId} não encontrado.` });
      }

      if (!servico) {
        return res
          .status(404)
          .json({ message: `Serviço com ID ${servicoId} não encontrado.` });
      }

      const agendamentoObj = await Agendamento.create({
        servicoId,
        realizado,
        dataAgendada,
        petId,
      });

      res
        .status(201)
        .json({
          message: "Agendamento criado com sucesso!",
          agendamento: agendamentoObj,
        });
    }
  } catch (err) {
    // Verifica se o erro é de validação do Joi
    if (err.name === "ValidationError") {
      const formattedError = formatErrorMessage(err);
      return res.status(400).json({ message: formattedError });
    }

    // Verifica se o erro é de constraint de chave estrangeira
    if (err.name === "SequelizeForeignKeyConstraintError") {
      return res
        .status(400)
        .json({ message: "Chave estrangeira não encontrada" });
    }

    // Verifica se o erro é de constraint de chave única
    if (err.name === "SequelizeUniqueConstraintError") {
      return res
        .status(400)
        .json({ message: "Já existe um pedido com o mesmo número." });
    }

    console.log(err);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
});

router.put("/agendamentos/:id", async (req, res) => {
  const { id } = req.params;
  const { agendamento } = req.body;

  if (!agendamento) {
    return res.status(400).json({
      message: "O corpo da requisição deve conter pelo menos um agendamento.",
      example: {
        agendamento: [
          {
            servicoId: "numeroID",
            realizado: "statusAgendamento",
            dataAgendada: "data no formato ANO/MES/DIA",
            petId: "numeroIDPet",
          },
        ],
      },
    });
  }

  if (!Array.isArray(agendamento) || agendamento.length === 0) {
    return res.status(400).json({
      message:
        'A propriedade "agendamento" deve ser um array com pelo menos um objeto.',
    });
  }

  const { error } = Joi.array()
    .items(agendamentoSchema)
    .validate(agendamento, { abortEarly: false });

  if (error) {
    const formattedError = formatErrorMessage(error);
    return res.status(400).json({ message: formattedError });
  }

  try {
    for (const item of agendamento) {
      const { servicoId, realizado, dataAgendada, petId } = item;
      const pet = await Pet.findByPk(petId);
      const servico = await Servico.findByPk(servicoId);

      if (!pet) {
        return res
          .status(404)
          .json({ message: `Pet com ID ${petId} não encontrado.` });
      }

      if (!servico) {
        return res
          .status(404)
          .json({ message: `Serviço com ID ${servicoId} não encontrado.` });
      }

      const [rowsUpdated] = await Agendamento.update(
        {
          servicoId,
          realizado,
          dataAgendada,
          petId,
        },
        { where: { servicoId } }
      );

      if (rowsUpdated === 0) {
        return res
          .status(404)
          .json({ message: `Agendamento com ID ${id} não encontrado.` });
      }

      const updatedAgendamento = await Agendamento.findOne({
        where: { servicoId },
      });

      res.json({
        message: "Agendamento atualizado com sucesso!",
        agendamento: updatedAgendamento,
      });
    }
  } catch (err) {
    // Verifica se o erro é de validação do Joi
    if (err.name === "ValidationError") {
      const formattedError = formatErrorMessage(err);
      return res.status(400).json({ message: formattedError });
    }

    // Verifica se o erro é de constraint de chave estrangeira
    if (err.name === "SequelizeForeignKeyConstraintError") {
      return res
        .status(400)
        .json({ message: "Chave estrangeira não encontrada" });
    }

    // Verifica se o erro é de constraint de chave única
    if (err.name === "SequelizeUniqueConstraintError") {
      return res
        .status(400)
        .json({ message: "Já existe um pedido com o mesmo número." });
    }

    console.log(err);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
});

router.delete("/agendamento/", async (req, res) => {
  res.json({ message: "É necessário fornecer o ID do Serviço" });
});

router.delete("/agendamento/:id", async (req, res) => {
  const agendamento = await Agendamento.findByPk(req.params.id);

  try {
    if (agendamento) {
      await agendamento.destroy();
      res.json({ message: "O agendamento foi removido.", agendamento });
    } else {
      res.status(404).json({ message: "O serviço não foi encontrado" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Um erro aconteceu." });
  }
});

module.exports = router;
