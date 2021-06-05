const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const busboy = require('connect-busboy');

const app = express();

app.use(busboy({
  highWaterMark: 2 * 1024 * 1024
}))

var corsOptions = {
  origin: "http://localhost:3000"
};

app.use(cors(corsOptions));

// parse requests of content-type - application/json
app.use(bodyParser.urlencoded({ extended: true }));

const db = require("./app/models");
db.mongoose
  .connect(db.url, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log("Connected to the database!");
  })
  .catch(err => {
    console.log("Cannot conenct to the database!", err);
  });

// simple route
app.get("/", (req,res) => {
  res.json({ message: "Welcomet to slippi wrapped application!"});
});

require("./app/routes/match.routes.js")(app);

// set port, listen for requests
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});