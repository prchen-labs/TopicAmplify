const express = require("express");
const searchController = require("../controllers/searchController");

const router = express.Router();

router.get("/search", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }

  res.render("search");
});

router.post("/search", searchController.search);

module.exports = router;

/*
// 獲取首頁登入資訊
router.get('/', function(req, res) {
  if(req.cookies.islogin){
    req.session.islogin=req.cookies.islogin;
  }
  if(req.session.islogin){
    res.locals.islogin=req.session.islogin;
  }
 res.render('index', { title: 'HOME',test:res.locals.islogin});
});
// 登入頁處理
router.route('/login')
  // get請求渲染頁面  
  .get(function(req, res) {
    if(req.session.islogin){
      res.locals.islogin=req.session.islogin;
    }
    if(req.cookies.islogin){
      req.session.islogin=req.cookies.islogin;
    }
    res.render('login', { title: '使用者登入' ,test:res.locals.islogin});
  })
  // post請求查詢使用者資訊
  .post(function(req, res) {
    client=usr.connect();
    result=null;
    // 呼叫資料庫方法
    usr.selectFun(client, req.body.username, function (result) {
      if(result[0]===undefined){
        res.send('沒有該使用者');
      }else{
        if(result[0].password==req.body.password){
          req.session.islogin=req.body.username;
          res.locals.islogin=req.session.islogin;
          res.cookie('islogin',res.locals.islogin,{maxAge:60000});
          res.redirect('/home');
        }else{
          res.redirect('/login');
        }
      }
    });
  });
// 退出登入頁處理
router.get('/logout', function(req, res) {
  res.clearCookie('islogin');
  req.session.destroy();
  res.redirect('/');
});
// home頁處理
router.get('/home', function(req, res) {
  if(req.session.islogin){
    res.locals.islogin=req.session.islogin;
  }
  if(req.cookies.islogin){
    req.session.islogin=req.cookies.islogin;
  }
  res.render('home', { title: 'Home', user: res.locals.islogin });
});
// 註冊頁處理
router.route('/reg')
  // get請求渲染頁面
  .get(function(req,res){
    res.render('reg',{title:'註冊'});
  })
  // post請求註冊使用者
  .post(function(req,res) {
    client = usr.connect();
    // 呼叫資料庫方法
    usr.insertFun(client,req.body.username ,req.body.password2, function (err) {
       if(err) throw err;
       res.send('註冊成功');
    });
  });
module.exports = router;
*/