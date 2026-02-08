const { userSchema } = require("../validation/userSchema");
const { StatusCodes } = require("http-status-codes");
const { createUser, verifyUserPassword } = require("../services/userService");
const { randomUUID } = require("crypto");
const jwt = require("jsonwebtoken");

const setJwtCookie = (req, res, user) => {
  // Sign JWT
  const payload = { id: user.id, csrfToken: randomUUID() };
  req.user = payload; // this is a convenient way to return the csrf token to the caller.
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" }); // 1 hour expiration

  // Set cookie.  Note that the cookie flags have to be different in production and in test.

  /*
  res.cookie("jwt", token, {
    ...(process.env.NODE_ENV === "production" && { domain: req.hostname }), // add domain into cookie for production only
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    maxAge: 3600000, // 1 hour expiration.  Ends up as max-age 3600 in the cookie.
  });*/
  res.cookie("jwt", token, {
    httpOnly: true,
    secure: false,
    sameSite: "None",
    maxAge: 3600000,
  });

  return payload.csrfToken; // this is needed in the body returned by logon() or register()
};

const logon = async (req, res) => {
  const { user, isValid } = await verifyUserPassword(
    req?.body?.email,
    req?.body?.password,
  );
  if (!isValid) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "Authentication Failed." });
  }
  const csrfToken = setJwtCookie(req, res, user);
  res.status(StatusCodes.OK).json({ name: user.name, csrfToken });
};

const register = async (req, res, next) => {
  try {
    let isPerson = false;

    if (req.body.recaptchaToken) {
      const token = req.body.recaptchaToken;

      const params = new URLSearchParams();
      params.append("secret", process.env.RECAPTCHA_SECRET);
      params.append("response", token);
      params.append("remoteip", req.ip);

      const response = await fetch(
        "https://www.google.com/recaptcha/api/siteverify",
        {
          method: "POST",
          body: params.toString(),
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      );

      const data = await response.json();
      if (data.success) isPerson = true;

      delete req.body.recaptchaToken;
    } else if (
      process.env.RECAPTCHA_BYPASS &&
      req.get("X-Recaptcha-Test") === process.env.RECAPTCHA_BYPASS
    ) {
      isPerson = true;
    }

    if (!isPerson) {
      return res
        .status(400)
        .json({ message: "We can't tell if you're a person or a bot." });
    }

    const { recaptchaToken, ...cleanBody } = req.body;
    req.body = {
      name: cleanBody.name,
      email: cleanBody.email,
      password: cleanBody.password,
    };

    const { error } = userSchema.validate(req.body);

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const user = await createUser(req.body);

    //return res.status(201).json(user);
    const csrfToken = setJwtCookie(req, res, user);

    return res.status(201).json({
      user: { name: user.name },
      csrfToken,
    });
  } catch (err) {
    next(err);
  }
};

const logoff = async (req, res) => {
  res.sendStatus(StatusCodes.OK);
};

module.exports = { logon, register, logoff };
