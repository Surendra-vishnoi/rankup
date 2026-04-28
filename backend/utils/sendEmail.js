import nodemailer from 'nodemailer';

export const sendEmail = async (to, subject, text, html) => {
  let transporter;

  // Check for required SMTP variables
  const isSmtpConfigured = process.env.SMTP_HOST && 
                         process.env.SMTP_USER && 
                         process.env.SMTP_PASS;

  if (isSmtpConfigured) {
    // Use real SMTP configuration
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Fallback to ethereal for testing if no SMTP is configured
    const testAccount = await nodemailer.createTestAccount();
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
    from: process.env.SMTP_FROM || process.env.SMTP_USER || '"RankUp" <no-reply@rankup.com>',
    to,
    subject,
    text,
    html: html || text,
  };

  const info = await transporter.sendMail(mailOptions);

  if (!isSmtpConfigured) {
    console.log('--- Test Email Sent ---');
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    console.log('-----------------------');
  }
  
  return info;
};

