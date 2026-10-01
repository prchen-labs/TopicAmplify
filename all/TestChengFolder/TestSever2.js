const express = require("express");
const https = require("https");
const testChengRouter = require("../TestCheng.js");
const fs = require("fs");
const ChengAPI = require("./ChengAPI.js");
const { MongoClient } = require('mongodb');
console.log(ChengAPI)
const app = express();
let site = 'topicamplify.com';
const key = `/etc/letsencrypt/live/${site}/privkey.pem`;
const cert = `/etc/letsencrypt/live/${site}/fullchain.pem`;
const options = {
  key: fs.readFileSync(key),
  cert: fs.readFileSync(cert),
};

app.get("/", async function(req, res) {
  const dataGetter = new ChengAPI.DataGetter("mongodb://127.0.0.1:27017", "sample_event_DB", "sample_event_Coll");
    
  //take the head list
  let SortedHeatData = await dataGetter.getDataByHeat("_id");//你可以設定要排序的key，e.g."Heat", timestamp, _id
  let jsonSortedHeatData = JSON.stringify(SortedHeatData,["_id", "EventID0308","Heat","timestamp"]);//你可以設定要要得的key    

  res.send(jsonSortedHeatData);
});

https.createServer(options, app)
  .listen(6001, function (req, res) {
    console.log("Server started at port 6001");
  });
