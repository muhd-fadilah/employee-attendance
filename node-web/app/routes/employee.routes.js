const { authJwt } = require("../middlewares");
const controller = require("../controllers/employee.controller");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.get(
    "/api/mark_attend",
    [authJwt.verifyToken],
    controller.markAttend
  )

  app.post(
    "/api/request_day_off",
    [authJwt.verifyToken],
    controller.createDayOffRequest
  )

  app.get(
    "/api/request_day_off",
    [authJwt.verifyToken],
    controller.showDayOffRequests
  )
};
