const express = require('express');
const router = express.Router();
const {	User} = require('../models/user');
// 驗證用戶帳號
router.get('/account/:verificationCode', async (req, res) => {
	try {
		const verificationCode = req.params.verificationCode;
		const user = await User.findOne({
			verificationCode
		});
		if (!user) {
			res.status(404).send({
				message: 'Invalid verification code'
			});
			return;
		}
		if (user.isVerified) {
			res.status(400).send({
				message: 'Your account has already been verified'
			});
			return;
		}
		user.isVerified = true;
		await user.save();
		res.status(200).send({
 			message: 'Your account has been verified successfully'
		});       
	} catch (err) {
		res.status(500).send({
			message: err.message
		});
	}
});
module.exports = router;