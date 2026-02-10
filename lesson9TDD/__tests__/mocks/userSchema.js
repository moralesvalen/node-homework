const Joi = require("joi");
/*
const userSchema = Joi.object({
  email: Joi.any(),
  name: Joi.any(),
  password: Joi.any(),
});
*/

const userSchema = Joi.object({
  name: Joi.string().min(1).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
}).unknown(true);

module.exports = { userSchema };
