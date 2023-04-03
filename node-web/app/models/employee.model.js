const mongoose = require("mongoose");
const { Schema } = mongoose;

const employee = mongoose.model(
  "Employee",
  new Schema(
    {
      ein: {
        type: String,
        required: true,
        unique: true,
      },
      password: { type: String, required: true },
      name: { type: String, required: true },
      roles: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Role",
          required: true,
        },
      ],
    },
    { timestamps: true }
  )
);

module.exports = employee;
