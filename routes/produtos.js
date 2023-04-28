const Produto = require("../database/produto");

const { Router } = require("express");

const router = Router();

router.get("/produtos", async (req,res) => {
    const listaProdutos = await Produto.findAll();
    res.json(listaProdutos);
});

router.get("/produtos/:id", async (req,res) => {
    const {id} = req.params;
    const {nome,categoria} = req.query;
    const produto = await Produto.findByPk(id, 
        {$or:[
            {categoria:{ $in : categoria}},
            {nome: nome}
        ]});
    if(produto) {
        res.status(200).json(pet);
    } else {
        res.status(404).json({message: "Produto não encontrado"})
    }
});

module.exports = router;