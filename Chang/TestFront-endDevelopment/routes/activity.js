const express = require('express');
const app = express();
const router = express.Router();
const ObjectId = require('mongodb').ObjectId;
var mongodb = require('mongodb').MongoClient;
const mongoose = require("mongoose");
const ChengAPI4 = require('../ChengAPI4');

// // 在這裡定義路由
// router.get('/', (req, res) => {
// //     res.render("activity.ejs");
//       res.send('Hello, World1!');
// });


router.get('/activity/:id', async function(req, res) {
//       res.send('Hello, World2!');    
	console.log('__dirname:\n', __dirname);
    console.log('ChengAPI4:\n', ChengAPI4);
	try {
		let targetEventID_similarityList = req.params.id; //string to int (only int)//Xreq.params.streamId
		//     targetEventID_similarityList = targetEventID_similarityList.trim()
		//     1.找原文本(被比較的文本)
		const client = await mongodb.connect('mongodb://localhost:27017/');
		//         console.log('Connected to MongoDB');
		const db = client.db('topic_collection');
		// 拿取原文本內容
		const orinDataArticle = await db.collection('HeatEvent').findOne({
			//             _id: new mongoose.Types.ObjectId(req.params.id.trim())
			_id: new ObjectId(req.params.id.trim())
		});
		console.log("orinDataArticle:\n", orinDataArticle);
		// 找相似的文本
		//     2. 建立物件並連線：並連結對應的 uri, database, collection
		const eventCollection_similarityList = new ChengAPI4.EventCollection('mongodb://localhost:27017', 'topic_collection', 'similarityList_multiStore2');
		await eventCollection_similarityList.connect();
		//     3. 取出對應目標的similarityList：
		//用findByEventID0308Value函式：輸入：目標的EventID；輸出：similarityList
		let theSimilarityList = await eventCollection_similarityList.findById(targetEventID_similarityList); //有拿到
		//     console.log('theSimilarityList:\n',theSimilarityList);
		//     4. 連線取消
		await eventCollection_similarityList.disconnect();
		//     6.1 建構 mongodb collection 操作的物件(EventCollection物件專門操作mongodb的collection)
		//     輸入原文本的所在位置：uri, database, collection //這邊colleciton是原文本放置的位置，不同於上面的是相似度清單collection的位置(similarityList)
		const eventCollection = new ChengAPI4.EventCollection('mongodb://localhost:27017', 'topic_collection', 'original');
		//      6.2 連線
		await eventCollection.connect();
		let ortherDataArticle;
		let ortherDataArticles = [];
		for (let xth = 0; xth < 100; xth += 1) {
			//     5. 取出最相似文本(0號)的orignal_id
			let theCorrespondingArticleEventID = theSimilarityList.similarityList[xth].original_id;
			//     6. 從EventID尋找原文本
			let ortherDataArticle = await eventCollection.findBy_id(theCorrespondingArticleEventID.toString());
			ortherDataArticles.push(ortherDataArticle);
		}
		//     7. 連線取消
		await eventCollection.disconnect();
		//    8. check
		//         console.log("orinDataArticle:\n",orinDataArticle);
		//         console.log("ortherDataArticle:\n",ortherDataArticle);
		// 傳原文本和前10筆相似的文本
		//         console.log('ortherDataArticles:\n',ortherDataArticles);
		res.render('activity', {
			activity: orinDataArticle,
			similar_activity: ortherDataArticles,
		}); //原文本成功傳出去
	} catch (err) {
		console.error(err);
		res.sendStatus(500);
	}
});

// 導出路由器
module.exports = router;