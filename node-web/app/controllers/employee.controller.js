const db = require("../models");
const Attendance = db.attendance;
const DayOffPermission = db.dayOffPermission;
const Employee = db.employee;

exports.createDayOffRequest = (req, res) => {
  const currentDate = new Date().setHours(0, 0, 0);

  for (let i = 0; i < req.body.plannedDates.length; i++) {
    var plannedDate = new Date(req.body.plannedDates[i]).setHours(0, 0, 0);
    if (plannedDate < currentDate) {
      return res.status(422).send({ message: "Invalid Date" });
    }
  }

  const dayOffPermission = new DayOffPermission({
    employee: req.employeeId,
    reason: req.body.reason,
    plannedDates: req.body.plannedDates,
  });

  dayOffPermission
    .save()
    .then(() => {
      res.send({ message: "day off permission request has been sent!" });
      return;
    })
    .catch((err) => {
      res.status(500).send({ message: err });
      return;
    });
};

exports.markAttend = (req, res) => {
  var current = new Date();

  var openAttendanceHour = new Date();
  openAttendanceHour.setHours(process.env.OPEN_ATTENDANCE_HOUR, 0, 0);

  var endWorkingHour = new Date();
  endWorkingHour.setHours(process.env.END_WORKING_HOUR, 0, 0);

  if (current < openAttendanceHour || current > endWorkingHour) {
    res.status(400).send({
      message: `Attendance open at ${openAttendanceHour} and close at ${endWorkingHour}!`,
    });
    return;
  }

  const attendance = new Attendance({
    employee: req.employeeId,
    status: "present",
  });

  Attendance.countDocuments({
    employee: req.employeeId,
    createdAt: { $gte: openAttendanceHour, $lte: endWorkingHour },
  })
    .then((count) => {
      if (count !== 0) {
        res
          .status(400)
          .send({ message: "Attendance already filled for today!" });
        return;
      }

      attendance
        .save()
        .then(() => {
          res.send({ message: "Mark as attend succesfully!" });
          return;
        })
        .catch((err) => {
          res.status(500).send({ message: err });
          return;
        });
    })
    .catch((err) => {
      res.status(500).send({ message: err });
      return;
    });
};

// TODO: FIX HERE
exports.showDayOffRequests = (req, res) => {  
  Employee.findOne({ _id: req.employeeId })
    .then((result) => {
      if (result.roles.includes("admin")) {
        DayOffPermission.find()
          .then((results) => {
            res.send({
              message: "day off requests data retrieved!",
              data: results,
            });
          })
          .catch((err) => {
            res.status(500).send({ message: err });
            return;
          });
      } else {
        DayOffPermission.find({ employee: req.employeeId })
          .then((results) => {
            res.send({
              message: "day off requests data retrieved!",
              data: results,
            });
          })
          .catch((err) => {
            res.status(500).send({ message: err });
            return;
          });
      }
    })
    .catch((err) => {
      res.status(500).send({ message: err });
      return;
    });
};
