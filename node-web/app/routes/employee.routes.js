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

  app.get("/api/test/all", controller.allAccess);

  app.get("/api/test/", [authJwt.verifyToken], controller.normalBoard);

  app.get(
    "/api/test/admin",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.adminBoard
  );

  app.get(
    "/api/mark_attend",
    [authJwt.verifyToken],
    controller.markAttend
  )
};
