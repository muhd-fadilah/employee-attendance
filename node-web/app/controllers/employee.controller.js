const { employee } = require("../models");
const db = require("../models");
const Attendance = db.attendance;
const DayOffRequest = db.dayOffRequest;
const Employee = db.employee;
const Role = db.role;

exports.createDayOffRequest = (req, res) => {
  const currentDate = new Date().setHours(0, 0, 0);

  for (let i = 0; i < req.body.plannedDates.length; i++) {
    var plannedDate = new Date(req.body.plannedDates[i]).setHours(0, 0, 0);
    if (plannedDate < currentDate) {
      return res.status(422).send({ message: "Invalid Date" });
    }
  }

  const dayOffRequest = new DayOffRequest({
    employee: req.employeeId,
    reason: req.body.reason,
    plannedDates: req.body.plannedDates,
    status: "REQUESTED",
  });

  dayOffRequest
    .save()
    .then(() => {
      res.status(201).send({ message: "day off request has been created!" });
      return;
    })
    .catch((err) => {
      res.status(500).send({ message: err });
      return;
    });
};

exports.createAttendance = (req, res) => {
  var current = new Date();

  var openAttendanceHour = new Date();
  openAttendanceHour.setHours(process.env.OPEN_ATTENDANCE_HOUR, 0, 0);

  var endWorkingHour = new Date();
  endWorkingHour.setHours(process.env.END_WORKING_HOUR, 0, 0);

  var startWorkingHour = new Date();
  startWorkingHour.setHours(process.env.START_WORKING_HOUR, 0, 0);

  if (current < openAttendanceHour || current > endWorkingHour) {
    res.status(422).send({
      message: `attendance open at ${openAttendanceHour.toLocaleTimeString()} and close at ${endWorkingHour.toLocaleTimeString()}!`,
    });
    return;
  }

  const attendance = new Attendance({
    employee: req.employeeId,
    status: current <= startWorkingHour ? "ON_TIME" : "LATE",
  });

  Attendance.countDocuments({
    employee: req.employeeId,
    createdAt: { $gte: openAttendanceHour, $lte: endWorkingHour },
  })
    .then((count) => {
      if (count !== 0) {
        res
          .status(400)
          .send({ message: "attendance already created for today!" });
        return;
      }

      attendance
        .save()
        .then(() => {
          res.status(201).send({ message: "attendance has been created!" });
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

exports.showDayOffRequests = (req, res) => {
  Employee.findOne({ _id: req.employeeId })
    .then((result) => {
      Role.find({
        _id: { $in: result.roles },
      })
        .then((roles) => {
          var isAdmin = false;

          for (let i = 0; i < roles.length; i++) {
            if (roles[i].name === "admin") {
              isAdmin = true;
            }
          }
          if (isAdmin && req.query.showAll == "true") {
            DayOffRequest.find()
              .then((results) => {
                res.send({
                  message: "day off request data retrieved! showing all data.",
                  data: results,
                });
              })
              .catch((err) => {
                res.status(500).send({ message: err });
                return;
              });
          } else {
            DayOffRequest.find({ employee: req.employeeId })
              .then((results) => {
                res.send({
                  message:
                    "day off request data retrieved! showing data related to you.",
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
    })
    .catch((err) => {
      res.status(500).send({ message: err });
      return;
    });
};

exports.updateDayOffRequest = (req, res) => {
  var index = req.params.index;

  DayOffRequest.findOne({ _id: index })
    .then((result) => {
      if (result.employee == req.employeeId) {
        res.status(422).send({
          message: "can't change day off request created by yourself!",
        });
        return;
      }

      if (result.status == "ACCEPTED") {
        res.status(422).send({
          message:
            "can't change the status of already accepted day off request!",
        });
        return;
      }

      result.status = req.body.status;

      result
        .save()
        .then(() => {
          console.log(result.plannedDates);
          if (req.body.status == "ACCEPTED") {
            var attendances = [];

            for (let i = 0; i < result.plannedDates.length; i++) {
              if (result.plannedDates[i] < new Date()) {
                res.status(422).send({
                  message:
                    "failed to accept because one or more planned dates are in the past!",
                });

                return;
              }

              const current = result.plannedDates[i].setHours(
                process.env.OPEN_ATTENDANCE_HOUR,
                0,
                1
              );

              attendances.push(
                Attendance({
                  employee: result.employee._id,
                  status: "DAY_OFF",
                  createdAt: current,
                  updatedAt: current,
                })
              );
            }

            Attendance.insertMany(attendances)
              .then(() => {
                res.status(200).send({ message: "day off request updated" });
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
    })
    .catch((err) => {
      res.status(500).send({ message: err });
      return;
    });
};
