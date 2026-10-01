const { requiredEnv } = require('../../config/required-env.cjs');
const nodemailer = require('nodemailer');

// 創建一個SMTP transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: requiredEnv('SMTP_USER'), // 發送電子郵件的Gmail帳號
    pass: requiredEnv('SMTP_APP_PASSWORD') // Gmail帳號密碼
  }
});

// 定義電子郵件內容
const mailOptions = {
  from: requiredEnv('SMTP_USER'),
  to: requiredEnv('SMTP_TEST_RECIPIENT'), // 使用者的電子郵件地址
  subject: '請驗證您的帳號',
  text: '請點擊下方連結以完成帳號驗證：http://yourwebsite.com/verify'
};

// 使用transporter發送電子郵件
transporter.sendMail(mailOptions, function(error, info){
  if (error) {
    console.log(error);
  } else {
    console.log('Email sent: ' + info.response);
  }
});