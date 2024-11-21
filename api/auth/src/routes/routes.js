const express = require("express");
const router = express.Router();

const {
	ApiInfo,
	AuthenticatedUser,
	Login,
	Logout,
	Refresh,
	Register,
	Accounts,
} = require("../controllers/auth.js");

const { verifyAdmin } = require("../utils/verifyAdmin.js");

router.get("/", ApiInfo);
router.post("/register", Register);
router.post("/login", Login);
router.get("/user", AuthenticatedUser);
router.get("/accounts", verifyAdmin, Accounts);
router.post("/refresh", Refresh);
router.post("/logout", Logout);

module.exports = router;
