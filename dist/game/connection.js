"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    "database": process.env.MYSQL_DATABASE || "database",
    "host": process.env.MYSQL_HOST || "widt-mariadb",
    "port": process.env.MYSQL_POST || 3306
};
