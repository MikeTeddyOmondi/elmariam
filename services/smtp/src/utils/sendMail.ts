import nodemailer from "nodemailer";
import Handlebars from "handlebars";
import fs from "fs";
import path from "path";

const EMAIL_SENDER = process.env.EMAIL_SENDER || "";
const CLIENT_ID = process.env.CLIENT_ID || "";
const CLIENT_SECRET = process.env.CLIENT_SECRET || "";
const G_RFR_TKN = process.env.G_RFR_TKN || "";
const G_ACC_TKN = process.env.G_ACC_TKN || "";

const templatePath = path.join(__dirname, "../templates/email.hbs");
const templateSource = fs.readFileSync(templatePath, "utf-8");
const template = Handlebars.compile(templateSource);

function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export async function sendMail(data: { username: string; url: string }) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: EMAIL_SENDER,
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      refreshToken: G_RFR_TKN,
      accessToken: G_ACC_TKN,
    },
  } as any);

  const html = template({
    title: "Registration Successful ✔",
    username: capitalize(data.username),
    url: data.url,
  });

  await transporter.sendMail({
    from: EMAIL_SENDER,
    to: data.username,
    subject: "Registration Successful",
    html,
  });

  console.log(`✅  Email sent to ${data.username}`);
}
