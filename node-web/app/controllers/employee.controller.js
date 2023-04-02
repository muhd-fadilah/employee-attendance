const db = require("../models");
const Employee = db.employee;
const Attendance = db.attendance;

exports.allAccess = (req, res) => {
  res.status(200).send("Public Content.");
};

exports.normalBoard = (req, res) => {
  res.status(200).send("Normal Content.");
};

exports.adminBoard = (req, res) => {
  res.status(200).send("Admin Content.");
};

exports.markAttend = (req, res) => {
  var current = new Date();
   
  var openAttendanceHour = new Date();
  openAttendanceHour.setHours(process.env.OPEN_ATTENDANCE_HOUR, 0, 0);
  
  var endWorkingHour = new Date();
  endWorkingHour.setHours(process.env.END_WORKING_HOUR, 0, 0);

  if (current < openAttendanceHour || current > endWorkingHour) {
    res
      .status(400)
      .send({
        message: `Attendance open at ${openAttendanceHour} and close at ${endWorkingHour}!`,
      });
    return;
  }

  const attendance = new Attendance({
    employee: req.employeeId,
    status: 'present'
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
