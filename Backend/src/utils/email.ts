import nodemailer from 'nodemailer';

export const sendVerificationEmail = async (email: string, token: string): Promise<void> => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: Number(process.env.SMTP_PORT) || 2525,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS || '',
    },
  });

  // console.log(token)
  // Frontend URL jahan query param me token receive hoga
  const verificationUrl = `${'http://localhost:3000'}/api/auth/verify-email?token=${token}`;
  // console.log(verificationUrl)

  await transporter.sendMail({
    from: '"App Security" <no-reply@yourapp.com>',
    to: email,
    subject: 'Confirm Your Email Address',
    html: `
      <h2>Email Verification</h2>
      <p>Please click the link below to verify your email address:</p>
      <a href="${verificationUrl}" target="_blank" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
      <p>This link is valid for 24 hours.</p>
    `,
  });
};
