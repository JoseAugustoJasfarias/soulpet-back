const {DataTypes} = require("sequelize");
const { connection } = require("./database");

const Produto = connection.define("cliente", {
    nome: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    preco: {
        type: DataTypes.NUMBER,
        allowNull: false,
    },
    descricao: {
        type: DataTypes.STRING(150),
        allowNull: false,
    },
    desconto: {
        type: DataTypes.INT,
        allowNull: false,
    },
    dataDesconto: {
        type: DataTypes.DATE,
        allowNull: false
    },
    categoria: {
        type: DataTypes.STRING,
        allowNull: false
    }
});


module.exports = Produto;