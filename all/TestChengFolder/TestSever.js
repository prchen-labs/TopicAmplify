const {
	MongoClient
} = require('mongodb');
const express = require("express");
const https = require("https");
// const testChengRouter = require("../TestCheng.js");
const fs = require("fs");
const ChengAPI = require("./ChengAPI.js");
const ChengAPI3 = require('./ChengAPI3');
console.log(ChengAPI3)
// console.log(ChengAPI3)
const app = express();
// app.use("/testCheng", testChengRouter);
app.get("/", async function(req, res) {
	//     1. 設定
	let targetEventID_similarityList = 1;
	//     2. 建立物件並連線：並連結對應的 uri, database, collection
	const eventCollection_similarityList = new ChengAPI3.EventCollection('mongodb://localhost:27017', 'sample_event_DB', 'similarityList');
	await eventCollection_similarityList.connect();
	//     3. 取出對應目標的similarityList：
	//         用findByEventID0308Value函式：輸入：目標的EventID；輸出：similarityList
	let theSimilarityList = await eventCollection_similarityList.findByEventID0308Value(targetEventID_similarityList);
	//     4. 連線取消
	await eventCollection_similarityList.disconnect();
	//     5. 取出最相似文本(0號)的EventID
	let theCorrespondingArticleEventID = theSimilarityList.similarityList[0].EventID;
	//     6. 從EventID尋找原文本
	//         6.1 建構 mongodb collection 操作的物件(EventCollection物件專門操作mongodb的collection) 
	//     輸入原文本的所在位置：uri, database, collection //colleciton是原文本位置，上面的是相似度清單位置(similarityList)
	const eventCollection = new ChengAPI3.EventCollection('mongodb://localhost:27017', 'sample_event_DB', 'sample_event_Coll_copy');
	//         6.2 連線
	await eventCollection.connect();
	//         6.3 用findByEventID0308Value函式找原本
	let orinDataArticle = await eventCollection.findByEventID0308Value(targetEventID_similarityList);
    let ortherDataArticle = await eventCollection.findByEventID0308Value(theCorrespondingArticleEventID);
	//     7. 連線取消
	await eventCollection.disconnect();
    //    8. check
    console.log("orinDataArticle:\n",orinDataArticle);
    console.log("ortherDataArticle:\n",ortherDataArticle);
    orinDataArticle=JSON.stringify(orinDataArticle,null);
    ortherDataArticle=JSON.stringify(ortherDataArticle,null);
    res.status(200).json({
  orinDataArticle: orinDataArticle,
  ortherDataArticle: ortherDataArticle
})
    
    
});
let site = 'topicamplify.com';
const key = `/etc/letsencrypt/live/${site}/privkey.pem`;
const cert = `/etc/letsencrypt/live/${site}/fullchain.pem`;
const options = {
	key: fs.readFileSync(key),
	cert: fs.readFileSync(cert),
};
https.createServer(options, app).listen(6001, function(req, res) {
	console.log("Server started at port 6001");
});