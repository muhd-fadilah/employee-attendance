const mongoose = require("mongoose");
const { Schema } = mongoose;

const dayOffRequest = mongoose.model(
  "DayOffRequest",
  new Schema(
    {
      employee: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },
      reason: { type: String, required: true },
      status: {
        type: String,
        enum: ["REQUESTED", "ACCEPTED", "REJECTED"],
        required: true,
      },
      plannedDates: [{ type: Date, required: true }],
    },
    { timestamps: true }
  )
);

module.exports = dayOffRequest;
