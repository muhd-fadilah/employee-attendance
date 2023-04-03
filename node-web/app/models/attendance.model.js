const mongoose = require("mongoose");
const { Schema } = mongoose;

const attendance = mongoose.model(
  "Attendance",
  new Schema(
    {
      employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
        required: true,
      },
      status: {
        type: String,
        enum: ["ON_TIME", "DAY_OFF", "LATE", "NO_INFO"],
        required: true,
      },
    },
    { timestamps: true }
  )
);

module.exports = attendance;
