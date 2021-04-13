module.exports = app => {
  const matches = require("../controllers/match.controller.js");

  var router = require("express").Router();

  // Create a new Match
  router.post("/", matches.create);

  // Retrieve all Matches
  router.get("/", matches.findAll);

  // Retrieve all complete Matches
  router.get("/complete", matches.findAllComplete);

  app.use('/api/matches', router);
}