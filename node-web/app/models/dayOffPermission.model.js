const mongoose = require("mongoose");
const { Schema } = mongoose;

const dayOffPermission = mongoose.model(
  "DayOffPermission",
  new Schema(
    {
      employee: {
        type: mongoose.Schema.Types.ObjectId,
      },
      reason: String,
      accepted: Boolean,
      plannedDates: [ Date ]
    },
    { timestamps: true }
  )
);

module.exports = dayOffPermission;