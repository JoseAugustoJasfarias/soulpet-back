const { DataTypes } = require("sequelize");
const { connection } = require("./database");

    const Agendamento = connection.define("agendamento", {
    dataAgendada: {
        type: DataTypes.DATEONLY,
    },
    realizado: {
        type: DataTypes.BOOLEAN
    }
    });

module.exports = Agendamento
