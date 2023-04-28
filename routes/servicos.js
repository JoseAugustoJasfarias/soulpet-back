const Servico = require("../database/servico");
const { Router } = require("express");

const router = Router();

router.get("/servicos", async (req, res) => {
  const listarServicos = await Servico.findAll();
  res.json(listarServicos);
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

router.post("/servico", async (req, res) => {
  const { nome, preco } = req.body;

  if (nome && preco) {
    if (typeof nome !== "string" || typeof preco !== "number" || preco <= 0) {
      return res.status(400).json({ message: "Dados inválidos." });
    }
    try {
      const novoServico = await Servico.create({ nome, preco });
      res.status(201).json(novoServico);
    } catch (err) {
      console.log(err);
      if (err.name === "SequelizeValidationError") {
        res.status(400).json({ message: "Dados inválidos." });
      } else {
        res.status(500).json({ message: "Ocorreu um erro." });
      }
    }
  } else {
    res.status(500).json({ message: "Ocorreu um erro." });
  }
});

module.exports = router;
