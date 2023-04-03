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
      if(!result) {
        res.status(404).send({ message: "resource not found"});
        return;
      }
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

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1);
}

function getLastDayOfMonth(year, month) {
  return new Date(year, month + 1, 0);
}

exports.showDayOffRequestsMonthlyReport = async (req, res) => {
  try {
    const currentDate = new Date();
    const startDate = getFirstDayOfMonth(
      currentDate.getFullYear(),
      currentDate.getMonth()
    );
    const endDate = getLastDayOfMonth(
      currentDate.getFullYear(),
      currentDate.getMonth()
    );

    const employee = await Employee.findById(req.employeeId);
    const roles = await Role.find({ _id: { $in: employee.roles } });
    var isAdmin = false;

    for (let i = 0; i < roles.length; i++) {
      if (roles[i].name === "admin") {
        isAdmin = true;
        break;
      }
    }

    const matchQuery = () => {
      if (isAdmin && req.query.showAll == "true") {
        return {
          $match: {
            "_id": {
              $ne: null,
            },
          },
        };
      }

      return {
        $match: {
          "_id": employee._id,
        },
      };
    };

    var results = await Employee.aggregate([
      {
        $lookup: {
          from: "dayoffrequests",
          localField: "_id",
          foreignField: "employee",
          as: "att",
        },
      },
      {
        $unwind: "$att",
      },
      {
        $match: {
          "att.createdAt": {
            $gte: startDate,
            $lt: endDate,
          },
        },
      },
      {
        $group: {
          _id: "$_id",
          ein: { $first: "$ein" },
          name: { $first: "$name" },
          numOfAccepted: {
            $sum: {
              $cond: [
                {
                  $eq: ["$att.status", "ACCEPTED"],
                },
                1,
                0,
              ],
            },
          },
          numOfRejected: {
            $sum: {
              $cond: [
                {
                  $eq: ["$att.status", "REJECTED"],
                },
                1,
                0,
              ],
            },
          },
          numOfRequested: {
            $sum: {
              $cond: [
                {
                  $eq: ["$att.status", "REQUESTED"],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      matchQuery(),
    ]).exec();

    res.send({ message: "monthly report data retrieved!", data: { results } });
    return;
  } catch (err) {
    res.status(500).send({ message: err });
    return;
  }
}

exports.showAttendancesMonthlyReport = async (req, res) => {
  try {
    const currentDate = new Date();
    const startDate = getFirstDayOfMonth(
      currentDate.getFullYear(),
      currentDate.getMonth()
    );
    const endDate = getLastDayOfMonth(
      currentDate.getFullYear(),
      currentDate.getMonth()
    );

    const employee = await Employee.findById(req.employeeId);
    const roles = await Role.find({ _id: { $in: employee.roles } });
    var isAdmin = false;

    for (let i = 0; i < roles.length; i++) {
      if (roles[i].name === "admin") {
        isAdmin = true;
        break;
      }
    }

    const matchQuery = () => {
      if (isAdmin && req.query.showAll == "true") {
        return {
          $match: {
            "_id": {
              $ne: null,
            },
          },
        };
      }

      return {
        $match: {
          "_id": employee._id,
        },
      };
    };

    var results = await Employee.aggregate([
      {
        $lookup: {
          from: "attendances",
          localField: "_id",
          foreignField: "employee",
          as: "att",
        },
      },
      {
        $unwind: "$att",
      },
      {
        $match: {
          "att.createdAt": {
            $gte: startDate,
            $lt: endDate,
          },
        },
      },
      {
        $group: {
          _id: "$_id",
          ein: { $first: "$ein" },
          name: { $first: "$name" },
          numOfOnTime: {
            $sum: {
              $cond: [
                {
                  $eq: ["$att.status", "ON_TIME"],
                },
                1,
                0,
              ],
            },
          },
          numOfLate: {
            $sum: {
              $cond: [
                {
                  $eq: ["$att.status", "LATE"],
                },
                1,
                0,
              ],
            },
          },
          numOfDayOff: {
            $sum: {
              $cond: [
                {
                  $eq: ["$att.status", "DAY_OFF"],
                },
                1,
                0,
              ],
            },
          },
          numOfNoInfo: {
            $sum: {
              $cond: [
                {
                  $eq: ["$att.status", "NO_INFO"],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      matchQuery(),
    ]).exec();

    res.send({ message: "monthly report data retrieved!", data: { results } });
    return;
  } catch (err) {
    res.status(500).send({ message: err });
    return;
  }
};
