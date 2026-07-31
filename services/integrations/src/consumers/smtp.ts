import nodemailer from "nodemailer";
import Handlebars from "handlebars";
import fs from "fs";
import path from "path";
import { env } from "../config/env";

function loadTemplate(name: string) {
  const templatePath = path.join(__dirname, `../templates/${name}.hbs`);
  return Handlebars.compile(fs.readFileSync(templatePath, "utf-8"));
}

const template = loadTemplate("email");
const verificationCodeTemplate = loadTemplate("verification-code");

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

type RegistrationMail = { type?: "registration"; username: string; url: string };
type VerificationCodeMail = { type: "verification-code"; username: string; code: string };
export type MailMessage = RegistrationMail | VerificationCodeMail;

export async function handleSmtp(data: MailMessage) {
  const { subject, html } =
    data.type === "verification-code"
      ? {
          subject: "Your verification code",
          html: verificationCodeTemplate({
            title: "Your verification code",
            username: capitalize(data.username),
            code: data.code,
          }),
        }
      : {
          subject: "Registration Successful",
          html: template({
            title: "Registration Successful ✔",
            username: capitalize(data.username),
            url: data.url,
          }),
        };

  await transporter.sendMail({
    from: env.EMAIL_SENDER,
    to: data.username,
    subject,
    html,
  });

  console.log(`✅  Email sent to ${data.username} (${data.type ?? "registration"})`);
}
