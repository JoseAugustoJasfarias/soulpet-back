const Agendamento = require("../database/agendamento");
const { Router } = require("express");
const Servico = require("../database/servico");
const Pet = require("../database/pet");

// Criar o grupo de rotas 
const router = Router();

// Definição de rotas
// GET
router.get("/agendamentos", async (req, res) => {
    const agendamentos = await Agendamento.findAll();
    res.json(agendamentos);
});

// POST
router.post("/agendamentos", async (req, res) => {
    const {servicoId, realizado, dataAgendada, petId } = req.body;
    try {
    const pet = await Pet.findByPk(petId);
    const servico = await Servico.findByPk(servicoId);
    if (pet) {
        if (servico) {
            const agendamento = await Agendamento.create({ servicoId, realizado, dataAgendada, petId });
            res.status(201).json(agendamento);
        } else {
            res.status(404).json({ message: "Serviço não encontrado." });
        }
    } else {
        res.status(404).json({ message: "Pet não encontrado." });
    } 
    } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Um erro aconteceu." });
    }
});

module.exports = router;