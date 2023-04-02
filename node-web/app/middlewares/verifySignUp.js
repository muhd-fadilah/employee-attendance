const db = require("../models");
const roles = db.roles;
const employee = db.employee;

checkDuplicateEin = (req, res, next) => {
  employee
    .findOne({
      ein: req.body.ein,
    })
    .exec()
    .then((employee) => {
      if (employee) {
        res.status(400).send({ message: "Failed! EIN is already in use!" });
        return;
      }

      next();
    })
    .catch((err) => {
      res.status(500).send({ message: err });
      return;
    });
};

checkRolesExisted = (req, res, next) => {
  if (req.body.roles) {
    for (let i = 0; i < req.body.roles.length; i++) {
      if (!roles.includes(req.body.roles[i])) {
        res.status(400).send({
          message: `Failed! Role ${req.body.roles[i]} does not exist!`,
        });
        return;
      }

      if (
        req.body.roles[i] == "admin" &&
        req.body.admin_secret_key != process.env.ADMIN_SECRET_KEY
      ) {
        res.status(400).send({
          message: `Failed! Admin secret key is not valid!`,
        });
        return;
      }
    }
  }

  next();
};

const verifySignUp = {
  checkDuplicateEin,
  checkRolesExisted,
};

module.exports = verifySignUp;
