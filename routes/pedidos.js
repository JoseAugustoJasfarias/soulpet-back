const Cliente = require("../database/cliente");
const Pedido = require ("../database/pedido");

const { Router } = require("express");

// Criar o grupo de rotas (/pedidos)
const router = Router();

router.get("/pedidos", async (req, res) => {
  const listaPedidos = await Pedido.findAll();
  res.json(listaPedidos);
});

router.get("/pedidos/:id", async (req, res) => {
  const { id } = req.params;

  const pedido = await Pedido.findByPk(id);
  if (pedido) {
    res.json(pedido);
  } else {
    res.status(404).json({ message: "Pedido não encontrado." });
  }
});

router.get("/pedidos/produtos/:id", async (req, res) => {
    const { id } = req.params;
  
    try {
      const listaPedidos = await Pedido.findAll({
        include: [{
          model: Produto,
          where: { id: id }
        }, {
          model: Cliente
        }]
      });
  
      if (listaPedidos.length > 0) {
        res.json(listaPedidos);
      } else {
        res.status(404).json({ message: "Nenhum pedido encontrado com o produto especificado." });
      }
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar pedidos." });
    }
  });
  
  router.get("/pedidos/clientes/:id", async (req, res) => {
    const { id } = req.params;
  
    try {
      const listaPedidos = await Pedido.findAll({
        include: [{
          model: Cliente,
          where: { id: id }
        }, {
          model: Produto
        }]
      });
  
      if (listaPedidos.length > 0) {
        res.json(listaPedidos);
      } else {
        res.status(404).json({ message: "Nenhum pedido encontrado com o cliente especificado." });
      }
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar pedidos." });
    }
  });

  module.exports = router;