// requiring express
var express = require("express");
// requiring mongoose
var mongoose = require("mongoose");

// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

// is working on localhost3000
const PORT = process.env.PORT || 8080;

// Initialize Express
var app = express();

app.use(express.urlencoded({
  extended: true
}));
app.use(express.json());

// Make public a static folder
app.use(express.static("public"));

// If deployed, use the deployed database. Otherwise use the local mongoHeadlines database//
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

mongoose.connect(MONGODB_URI);

// A GET route for scraping the echoJS website
app.get("/scrape", function (req, res) {
  // First, we grab the body of the html with axios

  axios.get("https://stackoverflow.com/").then(function (response) {

    // Load the HTML into cheerio and save it to a variable
    // '$' becomes a shorthand for cheerio's selector commands, much like jQuery's '$'
    var $ = cheerio.load(response.data);

    // An empty array to save the data that we'll scrape
    var result = {};

    // Select each element in the HTML body from which you want information
    // NOTE: Cheerio selectors function similarly to jQuery's selectors,
    // but be sure to visit the package's npm page to see how it works
    $("a.question-hyperlink").each(function (i, element) {

      result.title = $(this).text();
      result.link = $(this).attr("href");


      // Create a new Question using the `result` object built from scraping
      db.Question.create(result)
        .then(function (dbQuestion) {
          // View the added result in the console
          console.log(dbQuestion);
        })
        .catch(function (err) {
          // If an error occurred, send it to the client
          return res.json(err);
        });


      // If we were able to successfully scrape and save an Question, send a message to the client
      res.send("Hey!!! You were able to sucessfully scrape!!!");
    });
  });
});

// Route for getting all Questions from the db
app.get("/Questions", function (req, res) {
  // Grab every document in the Questions collection
  db.Question.find({})
    .then(function (dbQuestion) {
      // If we were able to successfully find Questions, send them back to the client
      res.json(dbQuestion);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for grabbing a specific Question by id, populate it with it's note
app.get("/Questions/:id", function (req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.Question.findOne({
      _id: req.params.id
    })
    // ..and populate all of the notes associated with it
    .populate("note")
    .then(function (dbQuestion) {
      // If we were able to successfully find an Question with the given id, send it back to the client
      res.json(dbQuestion);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for saving/updating an Question's associated Note
app.post("/Questions/:id", function (req, res) {
  // Create a new note and pass the req.body to the entry
  db.Note.create(req.body)
    .then(function (dbNote) {
      // If a Note was created successfully, find one Question with an `_id` equal to `req.params.id`. Update the Question to be associated with the new Note
      // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
      return db.Question.findOneAndUpdate({
        _id: req.params.id
      }, {
        note: dbNote._id
      }, {
        new: true
      });
    })
    .then(function (dbQuestion) {
      // If we were able to successfully update an Question, send it back to the client
      res.json(dbQuestion);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Start the server
app.listen(PORT, function () {
  console.log("App running on port " + PORT + "!");
});