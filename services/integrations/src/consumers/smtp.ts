import nodemailer from "nodemailer";
import Handlebars from "handlebars";
import fs from "fs";
import path from "path";
import { env } from "../config/env";

const templatePath = path.join(__dirname, "../templates/email.hbs");
const templateSource = fs.readFileSync(templatePath, "utf-8");
const template = Handlebars.compile(templateSource);

function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export async function handleSmtp(data: { username: string; url: string }) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: env.EMAIL_SENDER,
      clientId: env.CLIENT_ID,
      clientSecret: env.CLIENT_SECRET,
      refreshToken: env.G_RFR_TKN,
      accessToken: env.G_ACC_TKN,
    },
  } as any);

  const html = template({
    title: "Registration Successful ✔",
    username: capitalize(data.username),
    url: data.url,
  });

  await transporter.sendMail({
    from: env.EMAIL_SENDER,
    to: data.username,
    subject: "Registration Successful",
    html,
  });

  console.log(`✅  Email sent to ${data.username}`);
}
