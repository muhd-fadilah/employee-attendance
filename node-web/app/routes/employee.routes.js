const { authJwt } = require("../middlewares");
const controller = require("../controllers/employee.controller");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.post(
    "/api/attendances",
    [authJwt.verifyToken],
    controller.createAttendance
  );

  app.get(
    "/api/attendances",
    [authJwt.verifyToken],
    controller.showAttendancesMonthlyReport
  );

  app.post(
    "/api/day_off_requests",
    [authJwt.verifyToken],
    controller.createDayOffRequest
  );

  app.get(
    "/api/day_off_requests",
    [authJwt.verifyToken],
    controller.showDayOffRequestsMonthlyReport
  );

  app.patch(
    "/api/day_off_requests/:index",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.updateDayOffRequest
  );
};
