const mongoose = require("mongoose")
const { Schema } = mongoose;

const employee = mongoose.model("employee", new Schema({
    ein: {
        type: String, 
        unique: true
    },
    password: String,
    name: String,
    roles: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Role"
        }
    ]
  }, { timestamps: true }
));

module.exports = employee