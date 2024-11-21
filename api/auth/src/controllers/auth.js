const bcryptjs = require("bcryptjs");
const { sign, verify } = require("jsonwebtoken");

const User = require("../models/User.js");
const Token = require("../models/Token.js");

const { createError } = require("../utils/error");

const { REFRESH_SECRET, ACCESS_SECRET } = require("../config/config.js");

exports.ApiInfo = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Auth API",
    description: "Auth API | Version 1",
  });
};

exports.Register = async (req, res, next) => {
  const { username, email, id_number, password, userType } = req.body;

  if (!username || !email || !password || !id_number || !userType) {
    return res
      .status(500)
      .json({ success: false, message: `Please enter all fields!` });
  }

  const userExists = await User.findOne({ email });
  const idNumberExists = await User.findOne({ id_number });
  const usernameTaken = await User.findOne({ username });

  if (userExists) {
    return res.status(500).json({
      success: false,
      message: "User already exists!",
    });
  }

  if (idNumberExists) {
    return res.status(500).json({
      success: false,
      message: "ID number already exists!",
    });
  }

  if (usernameTaken) {
    return res.status(500).json({
      success: false,
      message: "Username already taken!",
    });
  }

  const user = await User({
    username,
    email,
    password: await bcryptjs.hash(password, 12),
    id_number,
    userType,
  });

  user
    .save()
    .then((doc) => {
      const { password, isAdmin, userType, ...data } = doc._doc;
      res.status(201).json({ success: true, data: { user: data._id } });
    })
    .catch((err) => {
      console.log({ err });
      return next(createError(500, `Error saving user!`));
    });
};

exports.Login = async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return next(createError(400, `Invalid credentials!!`));
  }

  const isCorrect = await bcryptjs.compare(password, user.password);
  if (!isCorrect) {
    return next(createError(400, `Invalid credentials!!`));
  }

  const refreshToken = sign(
    {
      id: user._id,
      userType: user.userType,
      isAdmin: user.isAdmin,
    },
    REFRESH_SECRET,
    { expiresIn: "1h" }
  );
  console.log({ refreshToken });

  // res.cookie("refreshToken", refreshToken, {
  //   httpOnly: true,
  //   maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  // });

  const expired_at = new Date();
  // expired_at.setDate(expired_at.getDate() + 7);
  expired_at.setDate(expired_at.getDate());
  // console.log({ expired_at });

  // Upsert the refreshToken instead of saving
  // to avoid duplicate tokens with the same id

  await Token.updateOne(
    {
      user_id: user._id,
    },
    {
      $set: { token: refreshToken, expired_at },
    },
    { upsert: true }
  )
    .then(() => {
      const accessToken = sign(
        {
          id: user._id,
          userType: user.userType,
          isAdmin: user.isAdmin,
        },
        ACCESS_SECRET,
        { expiresIn: "30m" }
      );
      console.log({ accessToken });

      res.status(200).json({
        success: true,
        data: {
          accessToken,
          refreshToken,
        },
      });
    })
    .catch((err) => {
      console.log(err);
      return next(createError(500, `Error signing in!`));
    });
};

exports.AuthenticatedUser = async (req, res, next) => {
  try {
    const reqHeaders = req.headers["authorization"];
    if (!reqHeaders) {
      return next(createError(401, `Unauthenticated!`));
    }

    const accessToken = reqHeaders.split(" ")[1];
    if (!accessToken) {
      return next(createError(401, `Unauthenticated!`));
    }

    // const payload = verify(accessToken, ACCESS_SECRET);
    let payload;

    try {
      verify(accessToken, ACCESS_SECRET, (err, data) => {
        if (err) {
          console.log({ err });
          throw err;
        }
        payload = data;
        console.log({ payload });
      });
    } catch (error) {
      console.log({ error });
      return next(createError(401, `Invalid token!`));
    }

    const user = await User.findOne({ _id: payload.id });

    if (!user) {
      return next(createError(401, `Invalid token!`));
    }

    const {
      id_number,
      password,
      isAdmin,
      isActive,
      isVerified,
      resetLink,
      ...data
    } = user._doc;

    res.status(200).json({
      success: true,
      data: {
        user: data,
      },
    });
  } catch (err) {
    return next(createError(500, `${err.message}`));
  }
};

exports.Accounts = async (req, res, next) => {
  try {
    const users = await User.find();

    if (users.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          users: [],
        },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        users,
      },
    });
  } catch (err) {
    console.log({ err });
    return next(createError(500, `${err.message}`));
  }
};

exports.Refresh = async (req, res, next) => {
  try {
    // const refreshToken = req.cookies["refreshToken"];
    const refreshToken = req.headers["x-refresh-token"];
    console.log({ refreshToken });

    if (!refreshToken) {
      return next(createError(401, `Unauthenticated!`));
    }

    const payload = verify(refreshToken, REFRESH_SECRET);
    console.log({ payload });

    if (!payload) {
      return next(createError(401, `Unauthenticated!`));
    }

    const refreshtokenSaved = await Token.findOne({
      user_id: payload.id,
    });
    console.log({ refreshtokenSaved });

    if (!refreshtokenSaved) {
      return next(createError(401, `Unauthenticated!`));
    }

    const accessToken = sign(
      {
        id: payload.id,
        userType: payload.userType,
        isAdmin: payload.isAdmin,
      },
      ACCESS_SECRET,
      { expiresIn: "30m" }
    );
    console.log({ accessToken });

    res.status(200).json({
      success: true,
      data: {
        accessToken,
      },
    });
  } catch (err) {
    console.log({ err });
    return next(createError(401, `Unauthenticated!`));
  }
};

exports.Logout = async (req, res, next) => {
  // const refreshToken = req.cookies["refreshToken"];
  const refreshToken = req.headers["x-refresh-token"];

  try {
    if (refreshToken) {
      await Token.findOneAndDelete({ token: refreshToken });

      // res.cookie("refreshToken", "", { maxAge: 0 });

      res.status(200).json({
        success: true,
        message: "Sign out successful!",
      });
    } else {
      return next(createError(500, `Unauthenticated!`));
    }
  } catch (err) {
    console.log({ err });
    return next(createError(500, `Error signing out!`));
  }
};
