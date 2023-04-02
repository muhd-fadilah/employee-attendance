const config = require("../config/auth.config");
const db = require("../models");
const Employee = db.employee;
const Role = db.role;

var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");

exports.signup = (req, res) => {
  const employee = new Employee({
    ein: req.body.ein,
    name: req.body.name,
    password: bcrypt.hashSync(req.body.password, 8),
  });

  employee
    .save()
    .then((employee) => {
      if (req.body.roles) {
        Role.find({
          name: { $in: req.body.roles },
        })
          .then((roles) => {
            employee.roles = roles.map((role) => role._id);
            employee
              .save()
              .then(() => {
                res.send({ message: "employee was registered successfully!" });
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
      } else {
        Role.findOne({ name: "normal" })
          .then((role) => {
            employee.roles = [role._id];

            employee
              .save()
              .then(() => {
                res.send({ message: "employee was registered successfully!" });
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
      }
    })
    .catch((err) => {
      res.status(500).send({ message: err });
      return;
    });
};

exports.signin = (req, res) => {
  Employee.findOne({
    ein: req.body.ein,
  })
    .populate("roles", "-__v")
    .exec()
    .then((employee) => {
      if (!employee) {
        return res.status(404).send({ message: "employee Not found." });
      }

      var passwordIsValid = bcrypt.compareSync(
        req.body.password,
        employee.password
      );

      if (!passwordIsValid) {
        return res.status(401).send({
          accessToken: null,
          message: "Invalid Password!",
        });
      }

      var token = jwt.sign({ id: employee._id }, config.secret, {
        expiresIn: 86400, // 24 hours
      });

      var authorities = [];

      for (let i = 0; i < employee.roles.length; i++) {
        authorities.push("ROLE_" + employee.roles[i].name.toUpperCase());
      }

      res.status(200).send({
        id: employee._id,
        ein: employee.ein,
        roles: authorities,
        accessToken: token,
      });
    })
    .catch((err) => {
      res.status(500).send({ message: err });
      return;
    });
};
