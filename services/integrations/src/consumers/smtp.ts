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

const transporter = nodemailer.createTransport({
  host: "smtp.resend.com",
  port: 465,
  secure: true,
  auth: {
    user: "resend",
    pass: env.RESEND_API_KEY,
  },
});

export async function handleSmtp(data: { username: string; url: string }) {
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
