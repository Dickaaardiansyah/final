import { Sequelize } from "sequelize";

const db = new Sequelize('magang', 'root', '', {
    host: 'localhost',
    dialect: 'mysql',   
});

export default db;