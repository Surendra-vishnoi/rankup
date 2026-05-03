import nodemailer from 'nodemailer';
import dns from 'dns';

// Force Node.js to prefer IPv4 over IPv6 for DNS resolution globally
// This prevents ENETUNREACH errors on cloud providers with broken IPv6 routing
dns.setDefaultResultOrder('ipv4first');

export const sendEmail = async (to, subject, text, html) => {
  let transporter;

  // Check for required SMTP variables
  const isSmtpConfigured = process.env.SMTP_HOST && 
                         process.env.SMTP_USER && 
                         process.env.SMTP_PASS;

  if (isSmtpConfigured) {
    const port   = parseInt(process.env.SMTP_PORT || '587', 10);
    const secure = process.env.SMTP_SECURE === 'true'; // true only for port 465

    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure,           // false for 587 (STARTTLS), true for 465 (SSL)
      requireTLS: !secure, // force STARTTLS upgrade on port 587
      family: 4,        // force IPv4 to avoid ENETUNREACH on Render's IPv6
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        // Do not fail on self-signed certs (helpful in some environments)
        rejectUnauthorized: false,
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
