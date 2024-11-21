const path = require("path");
const nodemailer = require("nodemailer");
const hbs = require("nodemailer-express-handlebars");

const {
  ACC_TKN,
  RFR_TKN,
  CLIENT_ID,
  EMAIL_SENDER,
  CLIENT_SECRET,
} = require("../config");

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

async function sendMail(data) {
  // Transporter instance
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      type: "OAuth2",
      user: EMAIL_SENDER,
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      refreshToken: RFR_TKN,
      accessToken: ACC_TKN,
    },
  });

  // Handlebar Options
  const handlebarOptions = {
    viewEngine: {
      extName: ".hbs",
      partialsDir: path.join(__dirname, "..", "views"),
      defaultLayout: false,
    },
    viewPath: path.join(__dirname, "..", "views"),
    extName: ".hbs",
  };

  transporter.use("compile", hbs(handlebarOptions));

  // Mail Options
  const mailOptions = {
    from: EMAIL_SENDER,
    to: data.email,
    subject: "Authentication | Registration Email 📩",
    template: "email",
    context: {
      title: "Registration Successful ✔",
      username: capitalize(data.username),
      url: data.url,
    },
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`> Email sent: ${info.response}`);
  } catch (err) {
    console.log(`> Error occurred while sending email: ${err}`);
  }
}

module.exports = { sendMail };
