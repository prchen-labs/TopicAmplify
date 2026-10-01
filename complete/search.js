const { requiredEnv } = require('../config/required-env.cjs');
const express = require('express');
const https = require('https');
const bodyParser = require('body-parser');
var mongodb = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const uuid = require('uuid');
const jwt = require('jsonwebtoken');
const mongoose = require("mongoose");
const { User } =  require('./user');
const path = require('path');
const fs = require('fs');
const ChengAPI4 = require('./ChengAPI4');
var url = "mongodb://localhost:27017/";
// const ChengAPI = require('./ChengAPI.js')
const app = express();
// var apiRouter = require('./routes/api');
// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public/css')); //主導航欄
app.use(express.static(__dirname + '/public/js')); //我不知道這什麼
app.use(express.static(__dirname + '/public/img')); //好像是左上角的圖
app.use(bodyParser.urlencoded({ extended: true }));
// app.set('views', path.join(__dirname, 'views'))
// app.get('/activity', function(req, res) {
//     res.render('activity', {title: '活動詳細頁面'});
// });
app.get('/activity/:id', async function(req, res) {
    console.log('__dirname:\n',__dirname)

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
        console.log("orinDataArticle:\n",orinDataArticle);
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
        for(let xth=0;xth<100;xth+=1){
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
     app.get('/', async(req, res) => {
        // .sort("-date") 按日期倒序排序，最新的資料排在前面
        // limit(10) 限制查詢結果的數量為10筆
        await db.collection('NewEvent').find().sort("-date").limit(5).toArray(async (err, result) => {
            if (err) {
                console.error(err);
                return;
            }
            const searches = [];
            for(var search of result) {
                let paragraphs = '';
                let max = 0;
                let longest = 0;
                for(var i=0; i<search.content.length; i++) {
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
                for(var sentence of selectPart) {
                    /*
                    if(sentence.length > 100) {
                        sentence = sentence.slice(0, 100) + '......';
                        //sentences.push(sentence.slice(0, 100) + '......');
                    }
                    */
                    if(chinese(sentence)) {
                        sentences += sentence;
                    }
                }
                if(sentences.length >= 200) {
                    sentences = sentences.slice(0, 200) + '......';
                }
                if(sentences.length > 0) {
                    paragraphs += sentences;
                } 
                if(paragraphs.length > 0) {
                    searches.push({ ...search, content: paragraphs });
                }               
            }
            res.render('index', { searches:  searches });
        });
    });

    app.post('/search', urlencodedParser, (req, postres) => {
        url = 'http://localhost:3939?search=' + req.body.search;
        const http = require('http');
        const ObjectID = require('mongodb').ObjectID;
        const db2 = client.db('topic_collection');//activity-collection, topic_collection
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
            res.on('close',async() => {
                topics = JSON.parse(data); 
                console.log('topics:\n',topics)//
                topics_result = [];
                async function get_topic(topic_id){
                    result = await db2.collection('original').findOne({_id:new ObjectID(topic_id)});
                    //searches,original
//                     console.log('result:\n',result);//null!

                    return result;
                }
                for(var c=0;c < topics.length;c++){
                    
                    topics_result.push(get_topic(topics[c][0])); 
                    if (c > 100) break;          
                }
                topics_result = await Promise.all(topics_result);
                const keyword = req.body.search.split(" ");
                for(var i=0; i<topics_result.length; i++) {
                    const topic = topics_result[i];
                    const paragraphs = topic.content;
                    const keyword = req.body.search.split(" ");
                    for(var j=0; j<paragraphs.length; j++) {
                        let paragraph = paragraphs[j];
                        // 紀錄段落是否顯示過
                        let hasmatch = false;
                        //  && !hasmatch
                        for(var k=0; k<keyword.length&& !hasmatch; k++) {
                            const keywords = keyword[k];
                            // 正規表達式匹配關鍵字
                            // gi 是正規表達式的兩個參數，代表全局匹配且不區分大小寫
                            const regular = new RegExp(keywords, 'gi');
                            const matches = paragraph.match(regular);
                            if(matches) {
                                for(var m=0; m<matches.length; m++) {
                                    const match = matches[0];
                                    const index = paragraph.indexOf(match);
                                    const part_color = paragraph.substring(0, index) + 
                                     '<span style = "background-color: yellow;">' + match + '</span>' + 
                                     paragraph.substring(index + match.length);
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
                        if(hasmatch) {
                            // 段落至少有一個關鍵字，存到 paragraphs
                            paragraphs[j] = paragraph;
                            if(paragraph.length > 300 || chinese(paragraph)) {
                                paragraphs[j] = paragraph.slice(0, 200) + '......';
                            }
                        }else{
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
                    return {...search, content};
                });
                //console.log(searches);
                postres.render('index', { searches:  searches });
            });
        });    
    });
});

app.get('/login', (req, res) => {
    res.render("Login");
});

app.get('/register', (req, res) => {
    res.render("Register");
});

const SECRET= requiredEnv('JWT_SECRET');
var jsonParser = bodyParser.json();
// 創建一個 in-memory 的 user database
const users = {};
app.post('/register', jsonParser, async (req, res) => {
    // 資料庫寫入
    //const username = req.body.username;
    //const password = req.body.password;
    //const email = req.body.email;
    const user = await User.create( {
        username: req.body.username,
        password: req.body.password,
        email: req.body.email
    });
    if(users[username]){
        res.status(400).send('帳號已註冊');
        return;
    }
    // 產生唯一的 session ID，作為 cookie 值
    const sessionId = uuid.v4();
     // 將使用者資訊儲存到 in-memory 的 user database
    const hashedPassword = await bcrypt.hash(password, 10);
    users[username] = {
        password: hashedPassword,
        sessionId,
    };
    // 在 cookie 中設定 session ID，讓使用者自動登入
    res.cookie('sessionId', sessionId);
    // 回應註冊成功的訊息
    res.status(201).send('註冊成功，帳號為 ${username}');
    res.redirect("/");
 });
 // 驗證使用者是否登入的 middleware
 const requireAuth = (req, res, next) => {
    const sessionId = req.cookies.sessionId;
    if (!sessionId || !Object.values(users).find((user) => user.sessionId === sessionId)) {
        res.status(401).send('請先登入');
        return;
    }
    next();
 }

app.post('/login', async(req, res) => {    
     // 查看用戶是否存在
     const user = await User.findOne({
         username: req.body.username,
     });
     if(!user) {
         return res.status(422).send( {
             message: '帳號不存在'
         });
     };
     const userN = req.body.username;
     // 比較密碼是否正確
     const isPassword = require("bcrypt").compareSync(
         req.body.password,  // 明文密碼
         user.password  // 以加密資料庫密碼
     );
     if(!isPassword) {
         return res.status(422).send( {
             message: '密碼錯誤'
         });
     };
     // 生成 token (告訴服務端，對應 ID 找用戶)
     const jwt = require("jsonwebtoken");
     const token = await jwt.sign( {
         id: String(user._id),
         }, SECRET 
     );
    // const FirsrLetter = user.charAt(0);
    res.render("index", { searches: null, user: userN });
    // console.log(FirsrLetter);
});

// Creating object of key and certificate
// for SSL
let site = 'topicamplify.com';
const key = `/etc/letsencrypt/live/${site}/privkey.pem`;
const cert = `/etc/letsencrypt/live/${site}/fullchain.pem`;
const options = {
	key: fs.readFileSync(key),
	cert: fs.readFileSync(cert),
};
// Creating https server by passing
// options and app object
https.createServer(options, app).listen(4002, function(req, res) {
	console.log("Server started at port 4002");
});