const mongoose = require("mongoose");
const { Schema } = mongoose;

const attendance = mongoose.model(
  "Attendance",
  new Schema(
    {
      employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
      },
      status: String
    },
    { timestamps: true }
  )
);

module.exports = attendance;