const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const User = require("../models/userModel");
const logger = require("../utils/logger");

// 註冊頁面
router.get("/register", (req, res) => {
  res.render("register");
});

// 註冊處理
router.post(
  "/register",
  [
    check("username").notEmpty().withMessage("請輸入使用者名稱"),
    check("email").isEmail().withMessage("請輸入有效的電子郵件地址"),
    check("password")
      .isLength({ min: 6 })
      .withMessage("密碼必須至少包含 6 個字符"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).render("register", { errors: errors.array() });
    }

    const { username, email, password } = req.body;

    try {
      const user = await User.findOne({ email });
      if (user) {
        return res.status(400).render("register", {
          errors: [{ msg: "該電子郵件地址已被註冊" }],
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({ username, email, password: hashedPassword });
      await newUser.save();
      req.session.user = newUser;
      return res.redirect("/");
    } catch (err) {
      logger.log({
        level: "error",
        message: err.message,
        stack: err.stack,
      });
      return res.status(500).send("Something broke!");
    }
  }
);

// 登入頁面
router.get("/login", (req, res) => {
  res.render("login");
});

// 登入處理
router.post(
  "/login",
  [
    check("email").isEmail().withMessage("請輸入有效的電子郵件地址"),
    check("password").notEmpty().withMessage("請輸入密碼"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).render("login", { errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).render("login", {
          errors: [{ msg: "無效的電子郵件地址或密碼" }],
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).render("login", {
          errors: [{ msg: "無效的電子郵件地址或密碼" }],
        });
      }

      req.session.user = user;
      return res.redirect("/");
    } catch (err) {
      logger.log({
        level: "error",
        message: err.message,
        stack: err.stack,
      });
      return res.status(500).send("Something broke!");
    }
  }
);

// 登出處理
router.get("/logout", (req, res) => {
req.session.destroy();
res.redirect("/");
});

module.exports = router;
