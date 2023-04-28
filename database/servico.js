const { DataTypes } = require("sequelize");
const { connection } = require("./database");
const Pet = require("./pet");

const Servico = connection.define("servico", {
  nome: {
    type: DataTypes.STRING(130),
    allowNull: false,
  },
  preco: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  },
});

// Relacionamento N:N (Um serviço pode ter N pets)
Servico.belongsToMany(Pet, { through: "ServicoPet", onDelete: "CASCADE" });
Pet.belongsToMany(Servico, { through: "ServicoPet" });

module.exports = Servico;
