const { requiredEnv } = require('../../config/required-env.cjs');
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require("bcrypt");
const path = require("path");
const MongoStore = require('connect-mongo');
const sessionStore = new MongoStore({ mongooseConnection: mongoose.connection });

// 引入路由檔案
const authRoutes = require('./routes/userRoutes');
const searchRoutes = require('./routes/searchRoutes');

const app = express();

// 使用 EJS 模板引擎
app.set('view engine', 'ejs');

// 設定靜態檔案路徑
app.use(express.static(__dirname + '/public/css'));
app.use(express.static(__dirname + '/public/js'));
app.use(express.static(__dirname + '/public/img'));

// 使用bodyParser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// 連接Mongodb資料庫
mongoose.connect("mongodb://localhost: 27017/mywebsite", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});

// 設置session
app.use(
    session({
      secret: requiredEnv('SESSION_SECRET'),
      resave: false,
      saveUninitialized: false,
      store: sessionStore
    })
);

// 設置路由
app.use('/user', userRoutes);
app.use('/search', searchRoutes);

// Handle 404 errors
app.use((req, res, next) => {
  res.status(404).send("404: Page not found");
});

// Handle server errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("500: Internal server error");
});


app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});