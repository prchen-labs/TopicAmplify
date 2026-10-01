onst validator = require("validator");

const validateRegisterForm = (username, email, password, confirmPassword) => {
  const errors = [];

  if (validator.isEmpty(username)) {
    errors.push({ message: "Username is required" });
  }

  if (!validator.isEmail(email)) {
    errors.push({ message: "Please enter a valid email address" });
  }

  if (!validator.isLength(password, { min: 8 })) {
    errors.push({ message: "Password must be at least 8 characters long" });
  }

  if (password !== confirmPassword) {
    errors.push({ message: "Passwords do not match" });
  }

  return errors;
};

const validateLoginForm = (email, password) => {
  const errors = [];

  if (!validator.isEmail(email)) {
    errors.push({ message: "Please enter a valid email address" });
  }

  if (validator.isEmpty(password)) {
    errors.push({ message: "Password is required" });
  }

  return errors;
};

module.exports = {
  validateRegisterForm,
  validateLoginForm,
};