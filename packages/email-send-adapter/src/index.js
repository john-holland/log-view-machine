/**
 * Email send adapter interface for magic link / verification.
 * sendEmail({ to, subject, html }): Promise<void>
 * Stub implementation does nothing; Nodemailer sends via SMTP when configured.
 */

import nodemailer from 'nodemailer';

/**
 * Create a stub email send adapter (logs in dev, no-op in prod unless replaced).
 * @param {{ nodeEnv?: string }} [options] - optional nodeEnv for logging (default from process.env.NODE_ENV)
 * @returns {function} sendEmail async function
 */
export function createStubEmailSendAdapter(options = {}) {
  const nodeEnv = options.nodeEnv ?? process.env.NODE_ENV;
  return async function sendEmail({ to, subject, html }) {
    if (nodeEnv !== 'production') {
      console.log('[email-send-adapter] stub:', { to, subject, htmlLength: (html || '').length });
    }
  };
}

/**
 * Create a Nodemailer email adapter (e.g. Gmail SMTP). On missing user or appPassword, returns a no-op so app can start.
 * @param {{ user: string, appPassword: string, host?: string, port?: number, secure?: boolean }} options
 * @returns {function} sendEmail async function
 */
export function createNodemailerEmailAdapter(options = {}) {
  const user = (options.user || '').trim();
  const appPassword = (options.appPassword || '').trim();
  if (!user || !appPassword) {
    return async function sendEmail() {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[email-send-adapter] Nodemailer skipped: missing user or appPassword');
      }
    };
  }
  const host = options.host || 'smtp.gmail.com';
  const port = options.port ?? 587;
  const secure = options.secure ?? false;
  const transport = nodemailer.createTransport({ host, port, secure, auth: { user, pass: appPassword } });

  return async function sendEmail({ to, subject, html }) {
    try {
      await transport.sendMail({ from: user, to, subject, html: html || '' });
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[email-send-adapter] send failed:', err.message);
      }
      throw err;
    }
  };
}
