const { DataTypes } = require("sequelize");
const { connection } = require("./database");
const Cliente = require("./cliente");
const Produto = require("./produto");

const Pedidos = connection.define("pedidos", {
    codigo: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false
    },
    quantidade: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
});

    Cliente.hasMany(Pedidos, {
        foreignKey: 'clienteId', 
        onDelete: 'CASCADE'
    });
    Pedidos.belongsTo(Cliente);


    Produto.hasMany(Pedidos, {
        foreignKey: 'produtoId', 
        onDelete: 'CASCADE'
    });
    Pedidos.belongsTo(Produto);

module.exports = Pedidos;