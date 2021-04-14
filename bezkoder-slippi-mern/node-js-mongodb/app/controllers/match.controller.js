const db = require("../models");
const Match = db.matches;

  // File storage location and naming
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, DIR);
  },
  filename: (req, file, cb) => {
      const fileName = file.originalname;
      cb(null,fileName)
  }
});

// Create and Save new matches
exports.create = (req, res) => {




};

// Retrieve all matches from the database 
exports.findAll = (req, res) => {
  const code = req.query.code;
  var condition = code ? { 'players.code': { $regex: new RegExp(code), $options: "i" } } : {};

  Match.find(condition)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving matches."
      });
    });
};

exports.findAllComplete = (req, res) => {
  const code = req.query.code;
  var condition = code ? { 'players.code': { $regex: new RegExp(code), $options: "i" } } : {};

  Match.find({condition, 'metadata.game_complete' : true})
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving matches."
      });
    });

    //http://localhost:8080/api/matches?code=CAVE#773/complete syntax
}