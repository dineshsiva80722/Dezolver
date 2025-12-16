import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    const mailOptions = {
      from: `"TechFolks" <${process.env.SMTP_USER || 'noreply@techfolks.com'}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, '')
    };

    if (process.env.NODE_ENV === 'production') {
      const info = await transporter.sendMail(mailOptions);
      logger.info(`Email sent: ${info.messageId}`);
    } else {
      logger.info(`[DEV] Email would be sent to: ${options.to}`);
      logger.info(`[DEV] Subject: ${options.subject}`);
    }
  } catch (error) {
    logger.error('Email sending failed:', error);
    throw new Error('Failed to send email');
  }
};

export const sendVerificationEmail = async (email: string, token: string) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  await sendEmail({
    to: email,
    subject: 'Verify your TechFolks account',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4f46e5; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; }
            .button { display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to TechFolks!</h1>
            </div>
            <div class="content">
              <h2>Verify Your Account</h2>
              <p>Thank you for registering with TechFolks. To complete your registration and start solving problems, please verify your email address by clicking the button below:</p>
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all;">${verificationUrl}</p>
              <p>This link will expire in 24 hours.</p>
              <p>If you didn't create an account with TechFolks, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 TechFolks. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `
  });
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  await sendEmail({
    to: email,
    subject: 'Password Reset Request - TechFolks',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; }
            .button { display: inline-block; padding: 12px 24px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>Reset Your Password</h2>
              <p>You recently requested to reset your password for your TechFolks account. Click the button below to reset it:</p>
              <a href="${resetUrl}" class="button">Reset Password</a>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all;">${resetUrl}</p>
              <p><strong>This link will expire in 1 hour for security reasons.</strong></p>
              <p>If you didn't request a password reset, please ignore this email. Your password won't be changed.</p>
              <p>For security reasons, we recommend that you:</p>
              <ul>
                <li>Use a strong, unique password</li>
                <li>Enable two-factor authentication (coming soon)</li>
                <li>Never share your password with anyone</li>
              </ul>
            </div>
            <div class="footer">
              <p>&copy; 2024 TechFolks. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `
  });
};

export const sendCertificateGeneratedEmail = async (
  email: string,
  learnerName: string,
  courseName: string,
  certificateId: string,
  pdfUrl: string,
  verificationUrl: string
) => {
  await sendEmail({
    to: email,
    subject: `🎉 Congratulations! Your Certificate is Ready - ${courseName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #16a34a; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; }
            .button { display: inline-block; padding: 12px 24px; background-color: #16a34a; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
            .certificate-info { background-color: #e6f7ff; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Congratulations, ${learnerName}!</h1>
            </div>
            <div class="content">
              <h2>Your Certificate is Ready!</h2>
              <p>We're excited to inform you that your certificate for <strong>${courseName}</strong> has been successfully generated and is ready for download.</p>
              
              <div class="certificate-info">
                <h3>Certificate Details:</h3>
                <p><strong>Course:</strong> ${courseName}</p>
                <p><strong>Recipient:</strong> ${learnerName}</p>
                <p><strong>Certificate ID:</strong> ${certificateId}</p>
                <p><strong>Issue Date:</strong> ${new Date().toLocaleDateString()}</p>
              </div>

              <div style="text-align: center;">
                <a href="${pdfUrl}" class="button">Download Certificate</a>
                <a href="${verificationUrl}" class="button" style="background-color: #4f46e5;">Verify Certificate</a>
              </div>

              <p><strong>What you can do with your certificate:</strong></p>
              <ul>
                <li>Add it to your LinkedIn profile</li>
                <li>Include it in your resume/CV</li>
                <li>Share it with potential employers</li>
                <li>Use the verification URL to prove its authenticity</li>
              </ul>

              <p>Your certificate is secured with a unique ID and QR code for verification purposes. Anyone can verify its authenticity using the verification link above.</p>

              <p>Keep up the great work and continue your learning journey with TechFolks!</p>
            </div>
            <div class="footer">
              <p>This certificate was automatically generated by TechFolks Certificate System</p>
              <p>&copy; 2024 TechFolks. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `
  });
};

export const sendSalarySlipEmail = async (
  email: string,
  employeeName: string,
  employeeId: string,
  payPeriod: string,
  netSalary: number,
  salarySlipUrl: string
) => {
  await sendEmail({
    to: email,
    subject: `Salary Slip for ${payPeriod} - TechFolks`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4f46e5; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; }
            .button { display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .salary-info { background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Salary Slip - ${payPeriod}</h1>
            </div>
            <div class="content">
              <h2>Dear ${employeeName},</h2>
              <p>Your salary slip for <strong>${payPeriod}</strong> is now available for download.</p>
              
              <div class="salary-info">
                <h3>Salary Summary:</h3>
                <p><strong>Employee ID:</strong> ${employeeId}</p>
                <p><strong>Pay Period:</strong> ${payPeriod}</p>
                <p><strong>Net Salary:</strong> ₹${netSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                <p><strong>Status:</strong> Processed</p>
              </div>

              <div style="text-align: center;">
                <a href="${salarySlipUrl}" class="button">Download Salary Slip</a>
              </div>

              <p><strong>Important Notes:</strong></p>
              <ul>
                <li>Please download and save your salary slip for your records</li>
                <li>This document serves as proof of income</li>
                <li>For any discrepancies, please contact the HR department</li>
                <li>Salary slips are confidential documents - please handle with care</li>
              </ul>

              <p>If you have any questions regarding your salary or benefits, please don't hesitate to reach out to our HR team at <a href="mailto:hr@techfolks.com">hr@techfolks.com</a>.</p>
            </div>
            <div class="footer">
              <p>This salary slip was automatically generated by TechFolks Payroll System</p>
              <p>&copy; 2024 TechFolks. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `
  });
};

export const sendPayrollProcessedNotification = async (
  email: string,
  employeeName: string,
  payPeriod: string,
  paymentDate: Date
) => {
  await sendEmail({
    to: email,
    subject: `💰 Salary Processed for ${payPeriod} - TechFolks`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #16a34a; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; }
            .payment-info { background-color: #d1fae5; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💰 Salary Processed!</h1>
            </div>
            <div class="content">
              <h2>Dear ${employeeName},</h2>
              <p>Good news! Your salary for <strong>${payPeriod}</strong> has been processed and will be credited to your bank account shortly.</p>
              
              <div class="payment-info">
                <h3>Payment Information:</h3>
                <p><strong>Pay Period:</strong> ${payPeriod}</p>
                <p><strong>Expected Credit Date:</strong> ${paymentDate.toLocaleDateString()}</p>
                <p><strong>Status:</strong> Processed ✅</p>
              </div>

              <p><strong>What happens next:</strong></p>
              <ul>
                <li>Your salary will be credited to your registered bank account</li>
                <li>You'll receive your salary slip via email once processing is complete</li>
                <li>Bank transfer may take 1-2 business days depending on your bank</li>
              </ul>

              <p>You can access your salary slip and payment history from your employee dashboard once it's available.</p>

              <p>Thank you for your hard work and dedication to TechFolks!</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 TechFolks. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `
  });
};
