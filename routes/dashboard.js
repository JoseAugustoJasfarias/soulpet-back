const Cliente = require('../database/cliente');
const Pet = require('../database/pet');
const Produto = require('../database/produto');
const Servico = require('../database/servico');
const Agendamento = require('../database/agendamento');
const {Router} = require('express');

const router = Router();

router.get("/dashboard", async(req,res) => {
    try{
        const totalClientes = await Cliente.count();
        const totalPets = await Pet.count();
        const totalProdutos = await Produto.count();
        const totalServicos = await Servico.count();
        const totalAgendamentos = await Agendamento.count();

        res.json({totalClientes, totalPets, totalProdutos, totalServicos, totalAgendamentos});
    } catch (error) {
        console.log(error);
        res.status(500).json({message :"Erro ao obter dados do dashboard"})
    }
});

module.exports = router;

