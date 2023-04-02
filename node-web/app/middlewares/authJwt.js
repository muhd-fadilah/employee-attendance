const jwt = require("jsonwebtoken");
const config = require("../config/auth.config.js");
const db = require("../models");
const employee = db.employee;
const Role = db.role;

verifyToken = (req, res, next) => {
  let token = req.headers["x-access-token"];

  if (!token) {
    return res.status(403).send({ message: "No token provided!" });
  }

  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized!" });
    }
    req.employerId = decoded.id;
    next();
  });
};

isAdmin = (req, res, next) => {
  employee
  .findById(req.employerId)
  .exec()
  .then((employee) => {
    Role.find(
      {
        _id: { $in: employee.roles }
      })
      .then((roles) => {
        
        for (let i = 0; i < roles.length; i++) {
          if (roles[i].name === "admin") {
            next();
            return;
          }
        }

        res.status(403).send({ message: "Require Admin Role!" });
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

const authJwt = {
    verifyToken,
    isAdmin
  };

module.exports = authJwt;