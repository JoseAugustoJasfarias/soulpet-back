const Cliente = require('../database/cliente');
const Pedido = require('../database/pedido');
const Produto = require('../database/produto'); // adicionado
const Joi = require('joi');
const { Sequelize, ValidationError } = require('sequelize');
const idSchema = Joi.number().integer().required();
const { body, check, param, validationResult } = require('express-validator');
const { Router } = require('express');
// Criar o grupo de rotas (/pedidos)
const router = Router();

router.get('/pedidos', async (req, res) => {
  const listaPedidos = await Pedido.findAll();
  res.json(listaPedidos);
});

router.get('/pedidos/:id', async (req, res) => {
  const { id } = req.params;

  const pedido = await Pedido.findByPk(id);
  if (pedido) {
    res.json(pedido);
  } else {
    res.status(404).json({ message: 'Pedido não encontrado.' });
  }
});

router.get('/pedidos/produtos/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const listaPedidos = await Pedido.findAll({
      include: [
        {
          model: Produto,
          where: { id: id }
        },
        {
          model: Cliente
        }
      ]
    });
    if (listaPedidos.length > 0) {
      res.json(listaPedidos);
    } else {
      res.status(404).json({
        message: 'Nenhum pedido encontrado com o produto especificado.'
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar pedidos.' });
  }
});

router.get('/pedidos/clientes/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const listaPedidos = await Pedido.findAll({
      include: [
        {
          model: Cliente,
          where: { id: id }
        },
        {
          model: Produto
        }
      ]
    });
    if (listaPedidos.length > 0) {
      res.json(listaPedidos);
    } else {
      res.status(404).json({
        message: 'Nenhum pedido encontrado com o cliente especificado.'
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar pedidos.' });
  }
});

// POST

const pedidoSchema = Joi.object({
  codigo: Joi.string().uuid({ version: 'uuidv4' }).required().messages({
    'any.required': 'O campo "codigo" é obrigatório.',
    'string.uuid': 'O campo "codigo" deve ser um UUID válido.',
    'string.empty': 'O campo "codigo" não pode ser vazio.',
    'string.base': 'O campo "codigo" não pode ser numérico.',
    'string.guid': 'O campo "codigo" deve ser um UUID válido.'
  }),
  quantidade: Joi.number().integer().positive().required().messages({
    'any.required': 'O campo "quantidade" é obrigatório.',
    'number.base': 'O campo "quantidade" deve ser um número inteiro positivo.',
    'string.empty': 'O campo "quantidade" não pode ser vazio.'
  }),
  clienteId: Joi.number().integer().positive().required().messages({
    'any.required': 'O campo "clienteId" é obrigatório.',
    'string.empty': 'O campo "clienteId" não pode ser vazio.',
    'number.base': 'O campo "clientId" deve ser um número inteiro positivo.'
  }),
  produtoId: Joi.number().integer().positive().required().messages({
    'any.required': 'O campo "produtoId" é obrigatório.',
    'string.empty': 'O campo "produtoId" não pode ser vazio.',
    'number.base': 'O campo "produtoId" deve ser um número inteiro positivo.'
  })
});

function formatErrorMessage(error) {
  const messages = error.details.map(detail => {
    let message = detail.message.replace(/"/g, '');
    message = message.charAt(0).toUpperCase() + message.slice(1);
    message = message.replace('is required', 'é obrigatório');
    message = message.replace('not allowed', 'não permitido');
    message = message.replace('must be a number', 'deve ser um número');
    message = message.replace('invalid', 'inválido');
    message = message.replace('_id', '');
    message = message.replace('is não permitido', 'não permitido');
    message = message.replace(/\[.+?\]\./g, ''); // Remove o [0].
    return message;
  });
  return messages.join(', ');
}

router.post('/pedidos', async (req, res) => {
  // Coletar os dados do req.body
  const { pedidos } = req.body;

  // Verificar se pedidos está definido e não vazio
  if (!pedidos || pedidos.length === 0) {
    return res.status(400).json({
      message: 'O corpo da requisição deve conter pelo menos um pedido.',
      example: {
        pedidos: [
          {
            codigo: '6b56c0de-59b8-4c64-a116-6e10a79e50c1',
            quantidade: 'numeroDaQuantidade',
            clienteId: 'numeroIDCliente',
            produtoId: 'numeroIDProduto'
          }
        ]
      }
    });
  }

  // Validar os dados de entrada
  const { error } = Joi.array()
    .items(pedidoSchema)
    .validate(pedidos, { abortEarly: false });
  if (error) {
    const formattedError = formatErrorMessage(error);
    return res.status(400).json({ message: formattedError });
  }

  try {
    // Insere os pedidos no banco de dados
    const result = await Pedido.bulkCreate(pedidos);

    res.status(201).json({ message: 'Pedidos criados com sucesso!', result });
  } catch (error) {
    // Verifica se o erro é de constraint de chave estrangeira
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      res.status(400).json({ message: 'Cliente não encontrado.' });
    } else {
      // Verifica se o erro é de constraint de chave única
      if (error.name === 'SequelizeUniqueConstraintError') {
        res
          .status(400)
          .json({ message: 'Já existe um pedido com o mesmo número.' });
      } else {
        console.log(error);
        res.status(500).json({ message: 'Um erro aconteceu.' });
      }
    }
  }
});

// Alterar pedido por Id
const validarBody = (req, res, next) => {
  const schema = Joi.object({
    quantidade: Joi.number().required(),
    clienteId: Joi.number().required(),
    produtoId: Joi.number().required()
  }).unknown(true);

  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const message = 'Erro de validação: ' + formatErrorMessage(error);
    return res.status(400).json({ message });
  }

  next();
};

router.put('/pedidos/:codigo', validarBody, async (req, res) => {
  const { codigo } = req.params;
  const { quantidade, clienteId, produtoId } = req.body;
  try {
    const schema = Joi.object({
      quantidade: Joi.number().required(),
      clienteId: Joi.number().required(),
      produtoId: Joi.number().required()
    }).unknown(true);

    const { error } = schema.validate(
      { quantidade, clienteId, produtoId },
      { abortEarly: false }
    );
    if (error) {
      const message = 'Erro de validação: ' + formatErrorMessage(error);
      return res.status(400).json({ message });
    }

    const pedido = await Pedido.findOne({ where: { codigo } });
    if (!pedido) {
      return res.status(404).json({ message: 'Pedido não encontrado.' });
    }

    const cliente = await Cliente.findOne({ where: { id: clienteId } });
    if (!cliente) {
      return res.status(404).json({
        message:
          'Cliente não encontrado para o id fornecido. Lembre-se, o id do cliente deve ser numérico.'
      });
    }

    const produto = await Produto.findOne({ where: { id: produtoId } });
    if (!produto) {
      return res.status(404).json({
        message:
          'Produto não encontrado para o id fornecido. Lembre-se, o id do produto deve ser numérico.'
      });
    }

    await Pedido.update(
      { quantidade, clienteId, produtoId },
      { where: { codigo } }
    );
    const updatedPedido = await Pedido.findOne({ where: { codigo } });
    res.json({
      message: 'Pedido atualizado com sucesso.',
      data: updatedPedido
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao atualizar pedido.' });
  }
});

router.delete('/pedido/:codigo', async (req, res) => {
  try {
    const { codigo } = req.params;
    const pedido = await Pedido.findOne({ where: { codigo } });

    if (pedido) {
      await pedido.destroy();
      res.json({ message: 'O pedido foi removido com sucesso', pedido });
    } else {
      res.status(404).json({ message: 'O pedido não foi encontrado' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Um erro aconteceu' });
  }
});

router.delete('/pedidos/clientes', async (req, res) => {
  res.json({ message: 'É necessário fornecer o ID do CLiente'});
});

router.delete('/pedidos/produtos', async (req, res) => {
  res.json({ message: 'É necessário fornecer o ID do Produto'});
});

router.delete('/pedidos/clientes/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const pedidosCliente = await Pedido.findAll({ where: { clienteId: id } });

    if (pedidosCliente.length > 0) {
      await Pedido.destroy({ where: { clienteId: id } });
      res.json({
        message: `Todos os pedidos do cliente ${id} foram removidos com sucesso`,
        deletedPedidos: pedidosCliente
      });
    } else if (isNaN(id)) {
      res.status(404).json({
        message: `O ID deve ser um número inteiro`
      });
    } else {
      res.status(404).json({
        message: `Nenhum pedido foi encontrado para o cliente com o ID ${id}`
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Um erro aconteceu' });
  }
});

router.delete('/pedidos/produtos/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const pedidosProduto = await Pedido.findAll({ where: { produtoId: id } });

    if (pedidosProduto.length > 0) {
      await Pedido.destroy({ where: { produtoId: id } });
      res.json({
        message: `Todos os pedidos com o ID ${id} do produto foram removidos com sucesso`,
        deletedPedidos: pedidosProduto
      });
    } else if (isNaN(id)) {
      res.status(404).json({
        message: `O ID deve ser um número inteiro`
      });
    } else {
      res.status(404).json({
        message: `Nenhum pedido foi encontrado para o produto com o ID ${id}`
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Um erro aconteceu' });
  }
});


module.exports = router;
