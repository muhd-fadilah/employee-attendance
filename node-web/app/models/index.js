const dbConfig = require("../config/db.config.js");

const mongoose = require("mongoose")
mongoose.Promise = global.Promise;

const db = {};
db.mongoose = mongoose;
db.url = dbConfig.url;
db.employee = require("./employee.model.js");
db.role = require("./role.model");
db.roles = ["normal", "admin"]

module.exports = db;
