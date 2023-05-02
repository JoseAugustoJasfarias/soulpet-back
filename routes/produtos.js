const Produto = require('../database/produto');
const { Router } = require('express');
const { Op } = require("sequelize")

const router = Router();
const Joi = require('joi');

const produtoSchema = Joi.object({
    nome: Joi.string().required().messages({
        'any.required': 'O campo "nome" é obrigatório.',
        'string.base': 'O campo "nome" não pode ser númerico. ',
        'string.empty': 'O campo "nome" não pode ser vazio.'
    }),
    preco: Joi.number().min(0).required().messages({
        'number.base': 'O campo "preço" deve ser um número.',
        'number.min': 'O campo "preço" deve ser um número maior ou igual a 0.',
        'any.required': 'O campo "preço" é obrigatório.',
        'string.empty': 'O campo "preço" não pode ser vazio.'
    }),
    descricao: Joi.string().required().messages({
        'any.required': 'O campo "descrição" é obrigatório.',
        'string.base': 'O campo "descrição" não pode ser númerico. ',
        'string.empty': 'O campo "descrição" não pode ser vazio.'
    }),
    desconto: Joi.number().min(0).max(1).required().messages({
        'number.base': 'O campo "desconto" deve ser um número.',
        'number.min': 'O campo "desconto" deve ser um número maior ou igual a 0.',
        'number.max': 'O campo "desconto" deve ser um número menor ou igual a 1.',
        'any.required': 'O campo "desconto" é obrigatório.',
        'string.empty': 'O campo "desconto" não pode ser vazio.'
    }),
    dataDesconto: Joi.date().greater('now').required().messages({
        'date.base': 'O campo "dataDesconto" deve ser uma data válida entre aspas no formato ANO/MES/DIA.',
        'date.greater': 'O campo "dataDesconto" deve ser uma data futura  data válida entre aspas no formato ANO/MES/DIA.',
        'any.required': 'O campo "dataDesconto" é obrigatório.',
        'string.empty': 'O campo "dataDesconto" não pode ser vazio.',
       
    }),
    categoria: Joi.string().valid('Higiene', 'Brinquedos', 'Conforto').required().messages({
        'any.only': 'O campo "categoria" deve ser uma das opções: Higiene, Brinquedos ou Conforto.',
        'any.required': 'O campo "categoria" é obrigatório.',
        'string.empty': 'O campo "categoria" não pode ser vazio.'
    })
});

router.get('/produtos', async (req, res) => {
    const listaProdutos = await Produto.findAll();
    res.json(listaProdutos);
});

router.get("/produtos/busca", async (req, res) => {
    const { nome, categoria } = req.query;
    const produtos = await Produto.findAll({
        where: {
            [Op.or]: {
                nome: { [Op.eq]: nome }, categoria: { [Op.eq]: categoria }
            }
        }
    });
    if (produtos) {
        res.json(produtos);
    } else {
        res.status(404).json({ message: "Nenhum produto foi encontrado." })
    }
});

router.get('/produtos/:id', async (req, res) => {
    const { id } = req.params;
    const produto = await Produto.findByPk(id);
    if (produto) {
        res.json(produto);
    } else {
        res.status(400).json({ message: "Produto não encontrado." });
    }
});

// Formatar a mensagem de error , removendo a \
function formatErrorMessage(error) {
    const messages = error.details.map(detail => {
        const message = detail.message.replace(/"/g, '');
        return message.charAt(0).toUpperCase() + message.slice(1);
    });

    return messages;
}

router.post('/produtos', async (req, res) => {
    const { error, value } = produtoSchema.validate(req.body, {
        abortEarly: false
    });

    if (error) {
        const messages = formatErrorMessage(error);
        return res.status(400).json({ message: messages });
    }

    try {
        const novoProduto = await Produto.create({
            nome: value.nome,
            preco: value.preco,
            descricao: value.descricao,
            desconto: value.desconto,
            dataDesconto: value.dataDesconto,
            categoria: value.categoria
        });
        res.status(201).json(novoProduto);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Um erro aconteceu.' });
    }
});

router.put("/produtos/:id", async (req, res) => {
    const { id } = req.params;
    const { nome, preco, descricao, desconto, dataDesconto, categoria } = req.body;
    const produto = await Produto.findByPk(id);
    try {
        const { error, value } = produtoSchema.validate(req.body, {
            abortEarly: false
        }); if (error) {
            const messages = formatErrorMessage(error);
            return res.status(400).json({ message: messages });
        }

        if (!nome || !preco || !descricao || !desconto || !dataDesconto || !categoria) {
            return res.status(400).json({ message: "Insira todos os campos referentes ao produto." });
        }

        if (produto) {
            await Produto.update(
                { nome, preco, descricao, desconto, dataDesconto, categoria },
                { where: { id: id } }
            );
            res.status(200).json({ message: "Produto editado!", produto });
        } else {
            res.status(404).json({ message: "Produto não encontrado." })
        }
    } catch (err) {
        res.status(500).json("Um erro aconteceu.");
    }
});


router.delete("/produto/:id", async (req, res) => {
    try {
        const produto = await Produto.findByPk(req.params.id);
        if (produto) {
            await produto.destroy();
            res.json({ message: "O serviço foi removido.", produto });
        } else {
            res.status(404).json({ message: "O serviço não foi encontrado" });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Um erro aconteceu." });
    }
});

router.delete("/produtos/deleteAll", async (req, res) => {
    try {
        const produtos = await Produto.findAll();
        await Produto.destroy({ where: {} });
        res.json({ message: "Todos os Produtos foram removidos.", produtos });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Um erro aconteceu." });
    }
});




module.exports = router;
