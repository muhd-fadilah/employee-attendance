// Use dotenv config
require("dotenv").config()

// Express function
const express = require("express")

// CORS function
const cors = require("cors")

// Instance of Express app
const app = express()

const db = require("./app/models");

const Role = db.role;

// Allowed origin for CORS
var corsOptions = {
    origin: "http://localhost:8081"
}

// Apply allowed origin for CORS
app.use(cors(corsOptions));

// Parse requests with content-type of application/json
app.use(express.json());

// Parse requests with content-type of - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }))

console.log(db.url);

db.mongoose
  .connect(db.url)
  .then(() => {
    console.log("Connected to the database")
  })
  .catch(err => {
    console.log("Cannot connect to the database!", err);
    process.exit();
  });

app.get("/", (req, res) => {
    res.json({ message: "Hello World!" })
});

const port = process.env.NODE_DOCKER_PORT || process.env.NODE_LOCAL_PORT;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

function initial() {
  Role.estimatedDocumentCount()
    .then((count) => {
      if (count === 0) {
        new Role({
          name: "normal"
        }).save()
          .then(() => {
            console.log("added 'normal' to roles collection");
          })
          .catch((err) => {
            console.log("error", err);
          });
  
          new Role({
            name: "admin"
          }).save()
            .then(() => {
              console.log("added 'admin' to roles collection");
            })
            .catch((err) => {
              console.log("error", err);
            });
      } else {
        console.log("roles already populated")
      }
      
    })
    .catch((err) => {
      console.log("error", err)
    })
}

initial()

require('./app/routes/auth.routes')(app);
require('./app/routes/employee.routes')(app);
