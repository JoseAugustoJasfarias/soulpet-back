const Agendamento = require("../database/agendamento");
const { Router } = require("express");

// Criar o grupo de rotas 
const router = Router();

// Definição de rotas
// GET
router.get("/agendamentos", async (req, res) => {
    const agendamentos = await Agendamento.findAll();
    res.json(agendamentos);
});

module.exports = router;