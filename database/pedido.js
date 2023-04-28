
const { DataTypes } = require("sequelize");
const { connection } = require("./database");
const { v4: uuidv4 } = require('uuid');
const Cliente = require("./cliente");
const Produto = require("./produto");



const Pedido = connection.define("pedido", {
  codigo: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  quantidade: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
});


// Associação 1:N (One-to-Many)
Cliente.hasMany(Pedido);
Pedido.belongsTo(Cliente);
Produto.hasMany(Pedido);
Pedido.belongsTo(Produto);


module.exports = Pedido;