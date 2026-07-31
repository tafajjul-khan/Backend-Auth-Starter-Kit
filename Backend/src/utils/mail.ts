import nodemailer from "nodemailer";
import dotenv from "dotenv"

dotenv.config()

interface SendEmailoptions {
  to: string;
  subject: string;
  html: string;
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "465", 10),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const SendEmail = async (options: SendEmailoptions): Promise<void> => {
  const mailOptions = {
    from: `"My App Support" <${process.env.SMTP_FROM}`,
    to: options.to,
    subject: options.subject,
    html: options.html,
  };
  await transporter.sendMail(mailOptions)
};
