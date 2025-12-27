/**
 * Email service using nodemailer SMTP transport
 * Lazy initialization pattern to prevent build errors when env vars not set
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { formatBalance } from '@/lib/credits-utils';

const globalForEmail = globalThis as unknown as {
  emailTransporter: Transporter | undefined;
};

/**
 * Create SMTP transporter with environment variables
 */
function createTransporter(): Transporter | null {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn('SMTP not configured: missing SMTP_HOST, SMTP_USER, or SMTP_PASS');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
  });
}

/**
 * Get or create email transporter (lazy initialization)
 */
function getTransporter(): Transporter | null {
  if (!globalForEmail.emailTransporter) {
    globalForEmail.emailTransporter = createTransporter() || undefined;
  }
  return globalForEmail.emailTransporter || null;
}

/**
 * Get the "from" address from environment
 */
function getFromAddress(): string {
  return process.env.SMTP_FROM || 'Kametrix <noreply@kametrix.com>';
}

interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Send an email using SMTP transport
 * Logs errors but doesn't throw (email failure shouldn't break app flow)
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const transporter = getTransporter();

  if (!transporter) {
    console.warn('Email not sent: SMTP not configured');
    return false;
  }

  try {
    await transporter.sendMail({
      from: getFromAddress(),
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
    console.log(`Email sent successfully to ${options.to}: ${options.subject}`);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(email: string, name?: string | null): Promise<boolean> {
  const greeting = name ? `Hi ${name},` : 'Hi there,';

  const text = `${greeting}

Welcome to Kametrix! We're excited to have you on board.

Here's how to get started:
1. Create your first AI voice agent from the dashboard
2. Add credits to your account to enable calls
3. Connect a phone number to start receiving calls

If you have any questions, just reply to this email - we're here to help!

Best,
The Kametrix Team`;

  return sendEmail({
    to: email,
    subject: 'Welcome to Kametrix',
    text,
  });
}

interface LowCreditEmailOptions {
  email: string;
  name?: string | null;
  currentBalance: number; // in cents
  graceCreditsUsed: number; // in cents
}

/**
 * Send low credit warning email
 */
export async function sendLowCreditEmail(options: LowCreditEmailOptions): Promise<boolean> {
  const { email, name, currentBalance, graceCreditsUsed } = options;
  const greeting = name ? `Hi ${name},` : 'Hi there,';

  const balanceDisplay = formatBalance(currentBalance);

  let graceWarning = '';
  if (graceCreditsUsed > 0) {
    const graceAmount = (graceCreditsUsed / 100).toFixed(2);
    graceWarning = `

Note: You've used $${graceAmount} in grace credits. This amount will be added to your next credit purchase.`;
  }

  const text = `${greeting}

Your Kametrix credit balance is running low.

Current balance: ${balanceDisplay}${graceWarning}

To ensure uninterrupted service for your AI voice agents, please add more credits to your account soon.

Log in to your dashboard to purchase credits:
${process.env.NEXT_PUBLIC_APP_URL || 'https://app.kametrix.com'}/dashboard

Best,
The Kametrix Team`;

  return sendEmail({
    to: email,
    subject: 'Low Credit Balance - Kametrix',
    text,
  });
}
