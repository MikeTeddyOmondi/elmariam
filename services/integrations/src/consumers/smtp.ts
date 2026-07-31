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
const contactEnquiryTemplate = loadTemplate("contact-enquiry");

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
type ContactEnquiryMail = {
  type: "contact-enquiry";
  name: string;
  email: string;
  message: string;
};
export type MailMessage = RegistrationMail | VerificationCodeMail | ContactEnquiryMail;

/** Where website enquiries land. Falls back to the sending address. */
const CONTACT_RECIPIENT = process.env.CONTACT_RECIPIENT || env.EMAIL_SENDER;

export async function handleSmtp(data: MailMessage) {
  if (data.type === "contact-enquiry") {
    // Goes to the business, not the enquirer. `replyTo` is the visitor so a
    // reply from the inbox reaches them directly.
    await transporter.sendMail({
      from: env.EMAIL_SENDER,
      to: CONTACT_RECIPIENT,
      replyTo: data.email,
      subject: `Website enquiry from ${data.name}`,
      html: contactEnquiryTemplate({
        title: "New website enquiry",
        name: capitalize(data.name),
        email: data.email,
        message: data.message,
      }),
    });

    console.log(`✅  Contact enquiry from ${data.email} forwarded to ${CONTACT_RECIPIENT}`);
    return;
  }

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
