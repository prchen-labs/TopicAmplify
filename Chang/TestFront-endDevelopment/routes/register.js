const { requiredEnv } = require('../../../config/required-env.cjs');
// 在ExpressJS的應用程式中
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
// const User = require('../models/user'); // User模型
const {	User, getUsersCount } = require('../models/user');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt'); // 用於密碼加密
// 產生一個>=六位數的隨機驗證碼
async function generateRandomCode() {
  const length = 5;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
    const count = await  getUsersCount();
    result +=count;
  return result;
}

const saltRounds = 10;
// console.log(User);
router.get('/register', (req, res) => {	res.render('Register.ejs');});
router.post('/register', async (req, res) => {
	const {
		username,
		email,
		password
	} = req.body;
	// 在MongoDB中查找用戶
	const userExists = await User.findOne({	username });

	if (userExists) {
		res.status(409).send({
			message: 'User already exists'
		});
		return;
	}
	const emailExists = await User.findOne({ email });
	if (emailExists) {
		res.status(409).send({	message: 'Email already exists'	});
		return;
	}
    const verificationCode = await generateRandomCode();
	// 將密碼加密後儲存到資料庫
	const hashedPassword = await bcrypt.hash(password, saltRounds);
	// 創建新用戶
	const newUser = new User({
		username,
		email,
		password: hashedPassword,
        verificationCode,
        isVerified: false
	});
	try {
		// 將新用戶儲存到MongoDB中
		const savedUser = await newUser.save();
//         res.send(`
//           <script>
//             alert('系統將寄送E-mail驗證信函至您註冊的電子信箱\n請您收到信後盡速進行"Email驗證"');
//             window.location.href = '/';
//           </script>
//         `);
        // 創建一個SMTP transporter
		const transporter = nodemailer.createTransport({
			service: 'gmail',
			auth: {
				user: requiredEnv('SMTP_USER'), // 發送電子郵件的Gmail帳號
				pass: requiredEnv('SMTP_APP_PASSWORD') // Gmail帳號密碼
			}
		});
        const host = req.headers.host;
		// 定義電子郵件內容
		const mailOptions = {
			from: requiredEnv('SMTP_USER'),
			to: email, // 使用者的電子郵件地址
			subject: '請驗證您的帳號',
// 			text:`請點擊下方連結以完成帳號驗證： https://${host}/account/${verificationCode}`
            html: `請點擊下方連結以完成帳號驗證：<a href="https://${host}/account/${verificationCode}">https://${host}/account/${verificationCode}</a>`
		};
		// 使用transporter發送電子郵件
		transporter.sendMail(mailOptions, function(error, info) {
			if (error) {
				console.log(error);
			} else {
				console.log('Email sent: ' + info.response);
//                 res.status(201).send(`<script>alert('請至電子郵件信箱中完成驗證程序，即可註冊成功'); window.location.href='/'</script>`);
//                 res.status(201).send(`<script>alert('系統將寄送E-mail驗證信函至您註冊的電子信箱\n請您收到信後盡速進行Email驗證'); window.location.href='/'</script>`);
res.status(201).send(`<script>alert('系統將寄送E-mail驗證信函至您註冊的電子信箱\\n請您收到信後盡速進行Email驗證'); window.location.href='/'</script>`);


			}
		});
	} catch (err) {
		res.status(500).send({
			message: err
		});
	}
});
module.exports = router;