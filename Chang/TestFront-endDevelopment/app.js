const express = require('express');
const https = require('https');
const bodyParser = require('body-parser');
var mongodb = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require("mongoose");
const { User } = require('./models/user'); // 引入 User 模型
const path = require('path');
const fs = require('fs');
const ChengAPI4 = require('./ChengAPI4');

var url = "mongodb://localhost:27017/";

// const ChengAPI = require('./ChengAPI.js')
// 導入路由模塊
const activityRouter = require('./routes/activity');
const verificationRouter = require('./routes/verification.js');
const loginRouter = require('./routes/login.js');
const registerRouter = require('./routes/register');
const logoutRouter = require('./routes/logout.js');

const app = express();

mongoose.connect('mongodb://localhost:27017/sample_users', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true, // 設置索引
  useFindAndModify: false // 關閉mongoose默認的findAndModify方法
});

// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public/css')); //主導航欄
app.use(express.static(__dirname + '/public/js')); //動態操作東西
app.use(express.static(__dirname + '/public/image')); //網站左上角的圖
app.set('views', path.join(__dirname, 'views'))
app.use(express.urlencoded({
	extended: false
}));
// 配置中间件
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

// 將路由模塊添加到應用程序中
app.use('/', activityRouter);
app.use('/', verificationRouter);
// app.use('/', loginRouter);
app.use(loginRouter);
loginRouter.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});
app.use(logoutRouter);
// console.log('registerRouter:\n',registerRouter);
app.use('/', registerRouter);


var urlencodedParser = bodyParser.urlencoded({
	extended: false
});


//const chinese = (str) =>  /^[\u4e00-\u9fa5]+$/.test(str);
const chinese = (str) => /^[\u4e00-\u9fa5。]+$/.test(str);
// Connect to the MongoDB database
mongodb.connect('mongodb://localhost:27017/', (err, client) => {
	if (err) {
		console.error(err);
		return;
	}
	console.log('Connected to MongoDB');
	const db = client.db('topic_collection');
	// const db = client.db('activity-collection');
	// const chinese = (str) =>  /^[\u4e00-\u9fa5]+$/.test(str);
	app.get('/', async (req, res) => {

		// .sort("-date") 按日期倒序排序，最新的資料排在前面
		// limit(10) 限制查詢結果的數量為10筆
		await db.collection('NewEvent').find().sort("-date").limit(100).toArray(async (err, result) => {
			if (err) {
				console.error(err);
				return;
			}
			const searches = [];
			for (var search of result) {
				let paragraphs = '';
				let max = 0;
				let longest = 0;
				for (var i = 0; i < search.content.length; i++) {
					const part = search.content[i];
					let length = 0;
					for (let sentence of part) {
						if (chinese(sentence)) {
							length += sentence.length;
						}
					}
					if (length > max) {
						max = length;
						longest = i;
					}
				}
				// 指定要顯示的段落索引值
				// const selectPart_Index = 7;  
				// 取得指定的段落
				const selectPart = search.content[longest];
				let sentences = '';
				//for(var paragraph of search.content) {
				//const sentences = [];
				for (var sentence of selectPart) {
					/*
					if(sentence.length > 100) {
					    sentence = sentence.slice(0, 100) + '......';
					    //sentences.push(sentence.slice(0, 100) + '......');
					}
					*/
					if (chinese(sentence)) {
						sentences += sentence;
					}
				}
				if (sentences.length >= 200) {
					sentences = sentences.slice(0, 200) + '......';
				}
				if (sentences.length > 0) {
					paragraphs += sentences;
				}
				if (paragraphs.length > 0) {
					searches.push({ ...search,
						content: paragraphs
					});
				}
			}
			res.render('index', {
				searches: searches
			});
		});
	});
	app.post('/search', urlencodedParser, (req, postres) => {
		url = 'http://localhost:3939?search=' + req.body.search;
		const http = require('http');
		const ObjectID = require('mongodb').ObjectID;
		const db2 = client.db('activity-collection'); //activity-collection, topic_collection
		//         console.log('db2:\n',db2);
		let request = http.get(url, (res) => {
			if (res.statusCode !== 200) {
				console.error(`Did not get an OK from the server. Code: ${res.statusCode}`);
				res.resume();
				return;
			}
			let data = '';
			res.on('data', (chunk) => {
				data += chunk;
			});
			res.on('close', async () => {
				topics = JSON.parse(data);
				console.log('topics:\n', topics) //
				topics_result = [];
				async function get_topic(topic_id) {
					result = await db2.collection('searches').findOne({
						_id: new ObjectID(topic_id)
					});
					//searches,original
					//                     console.log('result:\n',result);//null!
					return result;
				}
				for (var c = 0; c < topics.length; c++) {
					topics_result.push(get_topic(topics[c][0]));
					if (c > 100) break;
				}
				topics_result = await Promise.all(topics_result);
				const keyword = req.body.search.split(" ");
				for (var i = 0; i < topics_result.length; i++) {
					const topic = topics_result[i];
					const paragraphs = topic.content;
					const keyword = req.body.search.split(" ");
					for (var j = 0; j < paragraphs.length; j++) {
						let paragraph = paragraphs[j];
						// 紀錄段落是否顯示過
						let hasmatch = false;
						//  && !hasmatch
						for (var k = 0; k < keyword.length && !hasmatch; k++) {
							const keywords = keyword[k];
							// 正規表達式匹配關鍵字
							// gi 是正規表達式的兩個參數，代表全局匹配且不區分大小寫
							const regular = new RegExp(keywords, 'gi');
							const matches = paragraph.match(regular);
							if (matches) {
								for (var m = 0; m < matches.length; m++) {
									const match = matches[0];
									const index = paragraph.indexOf(match);
									const part_color = paragraph.substring(0, index) + '<span style = "background-color: yellow;">' + match + '</span>' + paragraph.substring(index + match.length);
									paragraph = part_color;
									hasmatch = true;
									break;
								}
							}
							/*const index = paragraph.indexOf(keywords);    
                            
							if(index != -1) {
							   const part_color = paragraph.substring(0, index) + 
							         '<span style = "background-color: red;">' + keyword + '</span>' + 
							         paragraph.substring(index + keyword.length);
							    paragraphs[j] = part_color;
							}
							*/
						}
						if (hasmatch) {
							// 段落至少有一個關鍵字，存到 paragraphs
							paragraphs[j] = paragraph;
							if (paragraph.length > 300 || chinese(paragraph)) {
								paragraphs[j] = paragraph.slice(0, 200) + '......';
							}
						} else {
							// j 當前段落索引
							paragraphs.splice(j, 1);
							j--;
						}
					}
				}
				const searches = topics_result.map(search => {
					const content = search.content.map(paragraph => {
						return paragraph;
					});
					return { ...search,
						content
					};
				});
				//console.log(searches);
				postres.render('index', {
					searches: searches
				});
			});
		});
	});
});

let site = 'topicamplify.com';
const key = `/etc/letsencrypt/live/${site}/privkey.pem`;
const cert = `/etc/letsencrypt/live/${site}/fullchain.pem`;
const options = {
	key: fs.readFileSync(key),
	cert: fs.readFileSync(cert),
};
// Creating https server by passing
// options and app object
https.createServer(options, app).listen(6002, function(req, res) {
	console.log("Server started at port 6002");
});