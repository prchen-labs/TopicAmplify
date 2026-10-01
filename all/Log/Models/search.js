const mongoose = require("mongoose");

const searchSchema = new mongoose.Schema({
  query: { type: String, required: true },
  results: { type: [String], required: true },
});

const Search = mongoose.model("Search", searchSchema);

module.exports = Search;