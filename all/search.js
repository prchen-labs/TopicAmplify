const { requiredEnv } = require('../config/required-env.cjs');
// app.js
const express = require('express');
const https = require('https');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const path = require("path");
const jwt = require('jsonwebtoken');
const mongoose = require("mongoose");
const { User } =  require('./user');
var mongodb = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";
const fs = require('fs');
const ChengAPI4 = require('./ChengAPI4.js')
const app = express();

// var apiRouter = require('./routes/api');

// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.use(express.static('public/css'));
app.use(express.static('public/js'));
app.use(express.static('public/image'));
app.use(bodyParser.urlencoded({ extended: true }));

var urlencodedParser = bodyParser.urlencoded({ extended: false });  
/*
app.get('/', async function(req, res) {
    const dataGetter = new ChengAPI.DataGetter('mongodb://localhost:27017/', 'sample_event_DB', 'sample_event_Coll');
    var SorteedHeatData = await dataGetter.getDataByHeat('Heat');//_id
    console.log(SorteedHeatData);
})
*/
 //const chinese = (str) =>  /^[\u4e00-\u9fa5]+$/.test(str);
 const chinese = (str) => /^[\u4e00-\u9fa5。]+$/.test(str);
// Connect to the MongoDB database
mongodb.connect('mongodb://localhost:27017/', (err, client) => {
    if (err) {
        console.error(err);
        return;
    }

    console.log('Connected to MongoDB');
    const db = client.db('sample_event_DB');
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
        url = 'http://localhost:3939?search=' + req.body.search
        const http = require('http');
        const ObjectID = require('mongodb').ObjectID;
        const db2 = client.db('activity-collection');
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
                topics_result = [];
                async function get_topic(topic_id){
                    result = await db2.collection('searches').findOne({_id:new ObjectID(topic_id)});
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
    res.render("login");
});

app.get('/register', (req, res) => {
    res.render("register");
});

const SECRET= requiredEnv('JWT_SECRET');
var jsonParser = bodyParser.json();
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
    res.render("index");
  });

app.post('/login', async(req, res) => {
    //const username = req.body.username;
    //const password = req.body.password;
    // 查看用戶是否存在
    const user = await User.findOne( {
        username: req.body.username,
    } );
    if(!user) {
        return res.status(422).send( {
            message: '用戶名不存在'
        } );
    };
    
    // 比較密碼是否正確
    const isPassword = require("bcrypt").compareSync(
        req.body.password,  // 明文密碼
        user.password  // 以加密資料庫密碼
    );
    if(!isPassword) {
        return res.status(422).send( {
            message: '密碼錯誤'
        } );
    };
    // 生成 token (告訴服務端，對應 ID 找用戶)
    const jwt = require("jsonwebtoken");
    const token = await jwt.sign( {
        id: String(user._id),
        }, SECRET 
    );
    res.render("index");
});





/*
app.get('/public/css', async(req, res) => {
    res.writeHeader(200,{'Content-Type':'text/css'});
    res.write(fs.readFileSync('public/css/rwd.css'));
    res.end();
});

app.get('/public/js', async(req, res) => {
    res.writeHeader(200,{'Content-Type':'text/javascript'});
    res.write(fs.readFileSync('public/js/index.js'));
    res.end();
});     

 app.get('/public/image', async(req, res) => {
    //res.writeHeader(200,{'Content-Type':'text/javascript'});
    res.write(fs.readFileSync('public/image/loud-speaker.png'));
    res.end();
});     
*/

/*

  // Connect to the MongoDB database
mongodb.connect('mongodb://localhost:27017/activity-collection', (err, client) => {
  if (err) {
    console.error(err);
    return;
  }

  console.log('Connected to MongoDB');
  
  // Set up the routes
  const db = client.db('activity-collection');
  app.get('/', async(req, res) => {
    // .sort("-date") 按日期倒序排序，最新的資料排在前面
    // limit(10) 限制查詢結果的數量為10筆
    await db.collection('searches').find().sort("-date").limit(10).toArray((err, result) => {
      if (err) {
        console.error(err);
        return;
      }
      res.render('index', { searches: result });
    });
  });
  */

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
https.createServer(options, app).listen(3002, function (req, res) {
  console.log("Server started at port 3002");
});