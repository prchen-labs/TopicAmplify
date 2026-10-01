const bcrypt = require("bcrypt");
const User = require("../Models/users");
const { validateRegisterForm, validateLoginForm } = require("../utils/validation");
const logger = require("../utils/logger");

const register = async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;

  const errors = validateRegisterForm(username, email, password, confirmPassword);
  if (errors.length > 0) {
    return res.render("register", { errors });
  }

  try {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      username,
      email,
      password: hashedPassword,
    });

    await user.save();

    logger.log({
      level: "info",
      message: 'User ${username} registered successfully',
    });

    res.redirect("/login");
  } catch (error) {
    logger.log({
      level: "error",
      message: 'Error registering user: ${error}',
    });

    res.render("register", { errors: [{ message: "An error occurred. Please try again later." }] });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  const errors = validateLoginForm(email, password);
  if (errors.length > 0) {
    return res.render("login", { errors });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.render("login", { errors: [{ message: "Invalid email or password." }] });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render("login", { errors: [{ message: "Invalid email or password." }] });
    }

    req.session.user = user;
    res.redirect("/search");
  } catch (error) {
    logger.log({
      level: "error",
      message: 'Error logging in user: ${error}',
    });

    res.render("login", { errors: [{ message: "An error occurred. Please try again later." }] });
  }
};

const logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
};

module.exports = {
  register,
  login,
  logout,
};