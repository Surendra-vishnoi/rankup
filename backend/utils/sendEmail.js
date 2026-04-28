import nodemailer from 'nodemailer';

let testAccount = null;

export const sendEmail = async (to, subject, text) => {
  let transporter;

  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    // Use real SMTP if configured
    transporter = nodemailer.createTransport({
      service: 'gmail', // or any other service you use
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  } else {
    // Fallback to ethereal for testing
    if (!testAccount) {
      testAccount = await nodemailer.createTestAccount();
    }
    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  const mailOptions = {
    from: process.env.EMAIL_USER || '"RankUp Auth" <no-reply@rankup.com>',
    to,
    subject,
    text,
  };

  const info = await transporter.sendMail(mailOptions);

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  }
};
