const Cliente = require("../database/cliente");
const Endereco = require("../database/endereco");
const Pet = require("../database/pet");
const pdfDoc = require('pdfkit');
const { Router } = require("express");
const Joi = require('joi');
const Sequelize = require('sequelize');


// Criar o grupo de rotas (/clientes)
const router = Router();

const schema = Joi.object({
  nome: Joi.string().required().messages({
    'any.required': 'O campo "nome" é obrigatório.',
    'string.empty': 'O campo "nome" não pode ser vazio.',
    'string.base': 'O campo "nome" não pode ser númerico. '
  }),
  email: Joi.string().email().required().messages({
    'any.required': 'O campo "email" é obrigatório.',
    'string.empty': 'O campo "email" não pode ser vazio.',
    'string.email': 'O campo "email" deve ser um endereço de e-mail válido.',
    'string.base': 'O campo "email" não pode ser númerico. '
  }),
  telefone: Joi.string().required().messages({
    'any.required': 'O campo "telefone" é obrigatório.',
    'string.empty': 'O campo "telefone" não pode ser vazio.',
    'string.base': 'O campo "telefone" não pode ser númerico. ',
  }),
  endereco: Joi.object({
    uf: Joi.string().length(2).required().messages({
      'any.required': 'O campo "uf" é obrigatório.',
      'string.empty': 'O campo "uf" não pode ser vazio.',
      'string.length': 'O campo "uf" deve ter exatamente 2 caracteres.',
      'string.base': 'O campo "uf" não pode ser númerico. ',
    }),
    cidade: Joi.string().required().messages({
      'any.required': 'O campo "cidade" é obrigatório.',
      'string.empty': 'O campo "cidade" não pode ser vazio.',
      'string.base': 'O campo "cidade" não pode ser númerico. ',
    }),
    cep: Joi.string().regex(/^\d{5}-\d{3}$/).required().messages({
      'any.required': 'O campo "cep" é obrigatório.',
      'string.empty': 'O campo "cep" não pode ser vazio.',
      'string.pattern.base': 'O campo "cep" deve estar no formato "xxxxx-xxx".',
      'string.base': 'O campo "cep" não pode ser númerico. ',
    }),
    rua: Joi.string().required().messages({
      'any.required': 'O campo "rua" é obrigatório.',
      'string.empty': 'O campo "rua" não pode ser vazio.',
      'string.base': 'O campo "rua" não pode ser númerico. ',
    }),
    numero: Joi.number().integer().positive().required().messages({
      'any.required': 'O campo "numero" é obrigatório.',
      'number.base': 'O campo "numero" deve ser um número inteiro positivo.'
    })
  }).required()
});



// Definição de rotas
router.get("/clientes", async (req, res) => {
  // SELECT * FROM clientes;
  const listaClientes = await Cliente.findAll();
  res.json(listaClientes);
});

// Endereço do cliente
router.get("/clientes/:id/endereco", async (req, res) => {
  const { id } = req.params
  const endereco = await Endereco.findOne({ where: { clienteId: id } })
  if (endereco) {
    res.json(endereco);
  } else {
    res.status(404).json({ message: "Usuário não encontrado." });
  }
})

// Listar pets do cliente
router.get("/clientes/:id/pets", async (req, res) => {
  const { id } = req.params
  const pet = await Pet.findAll({ where: { clienteId: id } })
  if (pet) {
    res.json(pet);
  } else {
    res.status(404).json({ message: "Usuário não encontrado." });
  }
})

// /clientes/1, 2
router.get("/clientes/:id", async (req, res) => {
  // SELECT * FROM clientes WHERE id = 1;
  const cliente = await Cliente.findOne({
    where: { id: req.params.id },
    include: [Endereco], // trás junto os dados de endereço
  });

  if (cliente) {
    res.json(cliente);
  } else {
    res.status(404).json({ message: "Usuário não encontrado." });
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

router.post("/clientes", async (req, res) => {
  // Coletar os dados do req.body
  const { nome, email, telefone, endereco } = req.body;

  // Validar os dados de entrada
  const { error } = schema.validate({ nome, email, telefone, endereco }, { abortEarly: false });
  if (error) {
    const messages = formatErrorMessage(error);
    return res.status(400).json({ messages });
  }

  try {
    // Dentro de 'novo' estará o objeto criado
    const novo = await Cliente.create(
      { nome, email, telefone, endereco },
      { include: [Endereco] }
    );

    res.status(201).json(novo);
  } catch (err) {
    if (err instanceof Sequelize.UniqueConstraintError) {
      res.status(400).json({ message: 'Já existe um cliente com o e-mail informado.' });
    } else {
      console.log(err);
      res.status(500).json({ message: "Um erro aconteceu." });
    }
  }
});



// atualizar um cliente
router.put("/clientes/:id", async (req, res) => {
  // obter dados do corpo da requisão
  const { nome, email, telefone, endereco } = req.body;
  // obter identificação do cliente pelos parametros da rota
  const { id } = req.params;
  try {

    if ( !nome || !email || !telefone || !endereco ){
      res.status(404).json({ message: "Insira todos os campos referente a Cliente ." });
    }else {
    // buscar cliente pelo id passado
    const cliente = await Cliente.findOne({ where: { id } });
    // validar a existência desse cliente no banco de dados
    if (cliente) {
      // validar a existência desse do endereço passdo no corpo da requisição
      if (endereco) {
        await Endereco.update(endereco, { where: { clienteId: id } });
      }
      // atualizar o cliente com nome, email e telefone
      await cliente.update({ nome, email, telefone });
      res.status(200).json({ message: "Cliente editado.",cliente });
    } else {
      res.status(404).json({ message: "Cliente não encontrado." });
    }}
  } catch (err) {
    if (err instanceof Sequelize.UniqueConstraintError) {
      res.status(400).json({ message: 'Já existe um cliente com o e-mail informado.' });
    } else {
      console.log(err);
      res.status(500).json({ message: "Um erro aconteceu." });
    }
  }

});

// excluir um cliente
router.delete("/clientes/:id", async (req, res) => {
  // obter identificação do cliente pela rota
  const { id } = req.params;
  // buscar cliente por id
  const cliente = await Cliente.findOne({ where: { id } });
  try {
    if (cliente) {
      await cliente.destroy();
      res.status(200).json({ message: "Cliente removido." });
    } else {
      res.status(404).json({ message: "Cliente não encontrado." });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Um erro aconteceu." });
  }
});


router.get('/relatorio', async (req, res) => {

  const relatorio = await Cliente.findAll({ include: [Endereco, Pet] });

  const doc = new pdfDoc();

  
  res.setHeader('Content-Disposition', 'attachment; filename="relatorioclientes.pdf"');

  
  doc.text('Relatório de clientes\n\n\n');
  relatorio.forEach(cliente => {

    doc.text(`Nome: ${cliente.nome}`);
    doc.text(`Telefone: ${cliente.telefone}`);
    doc.text(`Email: ${cliente.email}`);
    doc.text(`Rua: ${cliente.endereco.rua}`);
    doc.text(`Número: ${cliente.endereco.numero}`);
    doc.text(`Cidade: ${cliente.endereco.cidade}`);
    doc.text(`CEP: ${cliente.endereco.rep}`);
    doc.text(`UF: ${cliente.endereco.uf}`);

    if (cliente.pets && cliente.pets.length > 0) {
      doc.text('Pets:');
      doc.text(`Quantidade de pets: ${cliente.pets.length}`);
      cliente.pets.forEach((pet) => {
        doc.text(`${pet.nome} - ${pet.tipo}`);
      });
    }

    doc.text('\n\n\n');
  });

 
  res.setHeader('Content-Type', 'application/pdf');
  doc.pipe(res);
  doc.end();


});


module.exports = router;
