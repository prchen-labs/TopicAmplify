const { requiredEnv } = require('../../config/required-env.cjs');
const express = require("express");
const mongoose = require("mongoose");
const { User } =  require('./models');
//const { Search } =  require('./models');
const path = require("path");
const ejs = require("ejs");
const bodyParser = require("body-parser");
mongoose.set('strictQuery', false);
const https = require("https");
// Requiring file system to use local files
const fs = require("fs");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
//app.use(bodyParser.json())

app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');

// app.use(express.static(path.join(__dirname + '/public')));

//Cheng
//const TestCheng = require("./TestCheng.js");  // . -> 當前目錄
//app.use("/TestCheng" , TestCheng);
//Cheng
const SECRET= requiredEnv('JWT_SECRET');

/*app.get('/api/users', async(req, res) => {
    const users = await User.find();
    res.send(users);
} );*/
app.get('/', (req, res) => {
     res.render("home.html");
});

app.get('/login', (req, res) => {
    res.render("login.html");
});

app.get('/register', (req, res) => {
    res.render("register.html");
});

var jsonParser = bodyParser.json()
app.post('/register', jsonParser, async (req, res) => {
    // 資料庫寫入
    const user = await User.create( {
        username: req.body.username,
        password: req.body.password,
        email: req.body.email
    });
    res.render("home.html");
  });

app.post('/login', async(req, res) => {
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
    const token = jwt.sign( {
        id: String(user._id),
        }, SECRET 
    );
    res.render("home.html");
} );

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
https.createServer(options, app)
.listen(3001, function (req, res) {
  console.log("Server started at port 3001");
});
