import logging
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr
from typing import List, Optional

from app.core.celery_app import celery_app
from app.core.config import settings

logger = logging.getLogger(__name__)


def is_dev_mode() -> bool:
    """Check if application is running in development mode."""
    return settings.ENVIRONMENT == "development" or bool(settings.DEBUG)


def print_otp_banner(purpose: str, email: str, code: str, first_name: Optional[str] = None) -> None:
    """Print high-visibility OTP banner to terminal console in development."""
    user_info = f" ({first_name})" if first_name else ""
    banner = (
        f"\n{'=' * 65}\n"
        f"  [DEV OTP CONSOLE] {purpose.upper()}\n"
        f"  Recipient : {email}{user_info}\n"
        f"  OTP Code  : >>> {code} <<<\n"
        f"  Expires In: 15 minutes\n"
        f"{'=' * 65}\n"
    )
    print(banner, flush=True)


def send_smtp_message(
    to_email: str,
    subject: str,
    text_content: str,
    html_content: str,
) -> bool:
    """
    Deliver an email via SMTP with configurable host, port, TLS/SSL, and credentials.
    Supports Mailpit (dev), Gmail (App Password), SendGrid, Resend, Amazon SES, Brevo, etc.
    """
    if not settings.SMTP_HOST:
        logger.warning("SMTP_HOST not set. Skipping SMTP dispatch.")
        return False

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    from_name = settings.EMAILS_FROM_NAME or "Splitter App"
    from_email = settings.EMAILS_FROM_EMAIL or "noreply@splitter.local"
    msg["From"] = formataddr((from_name, from_email))
    msg["To"] = to_email

    msg.attach(MIMEText(text_content, "plain", "utf-8"))
    msg.attach(MIMEText(html_content, "html", "utf-8"))

    server = None
    use_ssl = (settings.SMTP_PORT == 465) or getattr(settings, "SMTP_SSL", False)
    use_tls = getattr(settings, "SMTP_TLS", True) or (settings.SMTP_PORT == 587)

    try:
        ssl_context = ssl.create_default_context()

        if use_ssl:
            # Direct SSL socket (SMTPS, Port 465)
            server = smtplib.SMTP_SSL(
                settings.SMTP_HOST,
                settings.SMTP_PORT,
                context=ssl_context,
                timeout=15,
            )
            server.ehlo()
        else:
            # Standard SMTP socket (Port 587 with STARTTLS, or dev Port 1025)
            server = smtplib.SMTP(
                settings.SMTP_HOST,
                settings.SMTP_PORT,
                timeout=15,
            )
            server.ehlo()
            if use_tls and settings.SMTP_PORT != 1025:
                try:
                    server.starttls(context=ssl_context)
                    server.ehlo()
                except Exception as tls_err:
                    logger.debug(f"STARTTLS negotiation info: {tls_err}")

        # Authenticate if username and password are provided
        if settings.SMTP_USER and settings.SMTP_PASSWORD:
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)

        server.sendmail(from_email, [to_email], msg.as_string())
        logger.info(f"Email successfully sent to {to_email} via SMTP ({settings.SMTP_HOST}:{settings.SMTP_PORT})")
        return True
    except smtplib.SMTPAuthenticationError as auth_err:
        logger.error(
            f"SMTP Authentication Failed for user '{settings.SMTP_USER}' on {settings.SMTP_HOST}:{settings.SMTP_PORT}: {auth_err}"
        )
        if is_dev_mode():
            return False
        raise auth_err
    except Exception as exc:
        logger.error(f"Failed to send email via SMTP ({settings.SMTP_HOST}:{settings.SMTP_PORT}): {exc}")
        if is_dev_mode():
            logger.warning("Dev mode active: OTP printed to console even if SMTP delivery failed.")
            return False
        raise exc
    finally:
        if server:
            try:
                server.quit()
            except Exception:
                pass


@celery_app.task(name="send_verification_email", bind=True, max_retries=3)
def send_verification_email(self, email: str, code: str, first_name: str):
    """
    Background Celery task to send account verification OTP.
    Prints OTP to console in development and delivers via SMTP (Mailpit).
    """
    try:
        logger.info(f"[EMAIL DISPATCH] Verification OTP for {first_name} ({email}): {code}")

        # Always print OTP directly to console if in development mode
        if is_dev_mode():
            print_otp_banner("Account Verification", email, code, first_name)

        subject = f"{code} is your Splitter verification code"
        text_body = (
            f"Hi {first_name},\n\n"
            f"Your verification code for Splitter is: {code}\n\n"
            f"This code will expire in {settings.VERIFICATION_CODE_EXPIRE_MINUTES} minutes.\n"
            f"If you did not request this, please ignore this email.\n\n"
            f"— The Splitter Team"
        )
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b1120; color: #f8fafc; padding: 40px 20px;">
          <div style="max-width: 480px; margin: 0 auto; background: #1e293b; border-radius: 16px; border: 1px solid #334155; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
            <div style="display: flex; align-items: center; margin-bottom: 24px;">
              <span style="font-size: 24px; font-weight: 800; background: linear-gradient(135deg, #10b981, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Splitter</span>
            </div>
            <h2 style="font-size: 20px; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 12px;">Verify your email address</h2>
            <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
              Hi {first_name}, welcome to Splitter! Please use the 6-digit verification code below to confirm your account:
            </p>
            <div style="background: #0f172a; border: 1px dashed #10b981; border-radius: 12px; padding: 18px; text-align: center; margin-bottom: 24px;">
              <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #34d399; font-family: monospace;">{code}</span>
            </div>
            <p style="color: #64748b; font-size: 13px; margin-bottom: 0;">
              This code expires in {settings.VERIFICATION_CODE_EXPIRE_MINUTES} minutes. If you didn't create an account, you can safely ignore this email.
            </p>
          </div>
        </body>
        </html>
        """

        send_smtp_message(email, subject, text_body, html_body)

        return {
            "status": "sent",
            "type": "verification_code",
            "recipient": email,
            "code": code,
        }
    except Exception as exc:
        logger.error(f"Failed to send verification email to {email}: {exc}")
        raise self.retry(exc=exc, countdown=10)


@celery_app.task(name="send_password_reset_email", bind=True, max_retries=3)
def send_password_reset_email(self, email: str, code: str, first_name: str):
    """Background task to send password reset OTP."""
    try:
        logger.info(f"[EMAIL DISPATCH] Password Reset code for {first_name} ({email}): {code}")

        # Always print OTP directly to console if in development mode
        if is_dev_mode():
            print_otp_banner("Password Reset", email, code, first_name)

        subject = f"{code} is your Splitter password reset code"
        text_body = (
            f"Hi {first_name},\n\n"
            f"You requested to reset your password. Your reset code is: {code}\n\n"
            f"This code will expire in {settings.PASSWORD_RESET_CODE_EXPIRE_MINUTES} minutes.\n"
            f"If you did not make this request, you can safely ignore this message.\n\n"
            f"— The Splitter Team"
        )
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b1120; color: #f8fafc; padding: 40px 20px;">
          <div style="max-width: 480px; margin: 0 auto; background: #1e293b; border-radius: 16px; border: 1px solid #334155; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
            <div style="display: flex; align-items: center; margin-bottom: 24px;">
              <span style="font-size: 24px; font-weight: 800; background: linear-gradient(135deg, #f59e0b, #ef4444); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Splitter</span>
            </div>
            <h2 style="font-size: 20px; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 12px;">Reset your password</h2>
            <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
              Hi {first_name}, use the verification code below to reset your password:
            </p>
            <div style="background: #0f172a; border: 1px dashed #f59e0b; border-radius: 12px; padding: 18px; text-align: center; margin-bottom: 24px;">
              <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #fbbf24; font-family: monospace;">{code}</span>
            </div>
            <p style="color: #64748b; font-size: 13px; margin-bottom: 0;">
              This code expires in {settings.PASSWORD_RESET_CODE_EXPIRE_MINUTES} minutes. If you did not request a password reset, no action is needed.
            </p>
          </div>
        </body>
        </html>
        """

        send_smtp_message(email, subject, text_body, html_body)

        return {
            "status": "sent",
            "type": "password_reset",
            "recipient": email,
            "code": code,
        }
    except Exception as exc:
        logger.error(f"Failed to send password reset email to {email}: {exc}")
        raise self.retry(exc=exc, countdown=10)


@celery_app.task(name="send_expense_notification")
def send_expense_notification(
    group_name: str,
    expense_title: str,
    amount: float,
    payer_name: str,
    recipient_emails: List[str],
):
    """Notify group members of a newly recorded expense."""
    logger.info(
        f"[NOTIFICATION] Group '{group_name}': {payer_name} added '{expense_title}' "
        f"for NPR {amount:,.2f}. Notifying: {recipient_emails}"
    )
    for recipient in recipient_emails:
        subject = f"New expense in {group_name}: {expense_title} (NPR {amount:,.2f})"
        text_body = (
            f"Hi,\n\n"
            f"{payer_name} added an expense '{expense_title}' (NPR {amount:,.2f}) to the group '{group_name}'.\n\n"
            f"Log in to Splitter to view your updated balance.\n\n"
            f"— The Splitter Team"
        )
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b1120; color: #f8fafc; padding: 40px 20px;">
          <div style="max-width: 480px; margin: 0 auto; background: #1e293b; border-radius: 16px; border: 1px solid #334155; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
            <div style="display: flex; align-items: center; margin-bottom: 24px;">
              <span style="font-size: 24px; font-weight: 800; background: linear-gradient(135deg, #10b981, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Splitter</span>
            </div>
            <h2 style="font-size: 20px; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 8px;">New Expense Added</h2>
            <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
              <strong style="color: #f1f5f9;">{payer_name}</strong> added an expense to <strong style="color: #f1f5f9;">{group_name}</strong>.
            </p>
            <div style="background: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
              <div style="font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Expense</div>
              <div style="font-size: 17px; font-weight: 700; color: #ffffff; margin-top: 4px;">{expense_title}</div>
              <div style="font-size: 24px; font-weight: 800; color: #34d399; margin-top: 10px;">NPR {amount:,.2f}</div>
            </div>
            <p style="color: #64748b; font-size: 13px; margin-bottom: 0;">
              Check your dashboard on Splitter to see your share and settlement options.
            </p>
          </div>
        </body>
        </html>
        """
        try:
            send_smtp_message(recipient, subject, text_body, html_body)
        except Exception as e:
            logger.warning(f"Could not send expense notification to {recipient}: {e}")

    return {"status": "dispatched", "recipients_count": len(recipient_emails)}


@celery_app.task(name="send_settlement_notification")
def send_settlement_notification(
    group_name: str,
    payer_name: str,
    receiver_name: str,
    amount: float,
    recipient_email: str,
):
    """Notify a group member that a settlement payment was recorded."""
    logger.info(
        f"[NOTIFICATION] Group '{group_name}': {payer_name} settled NPR {amount:,.2f} with {receiver_name}. "
        f"Notifying {recipient_email}"
    )
    if not recipient_email:
        return {"status": "skipped", "reason": "empty_recipient"}

    subject = f"Settlement recorded in {group_name}: NPR {amount:,.2f}"
    text_body = (
        f"Hi,\n\n"
        f"{payer_name} recorded a payment of NPR {amount:,.2f} to {receiver_name} in group '{group_name}'.\n\n"
        f"Check your updated balance on Splitter!\n\n"
        f"— The Splitter Team"
    )
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b1120; color: #f8fafc; padding: 40px 20px;">
      <div style="max-width: 480px; margin: 0 auto; background: #1e293b; border-radius: 16px; border: 1px solid #334155; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
        <div style="display: flex; align-items: center; margin-bottom: 24px;">
          <span style="font-size: 24px; font-weight: 800; background: linear-gradient(135deg, #10b981, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Splitter</span>
        </div>
        <h2 style="font-size: 20px; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 8px;">Settlement Recorded</h2>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
          A payment was recorded in <strong style="color: #f1f5f9;">{group_name}</strong>:
        </p>
        <div style="background: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
          <div style="font-size: 14px; color: #e2e8f0;"><strong style="color: #38bdf8;">{payer_name}</strong> paid <strong style="color: #34d399;">{receiver_name}</strong></div>
          <div style="font-size: 24px; font-weight: 800; color: #34d399; margin-top: 10px;">NPR {amount:,.2f}</div>
        </div>
        <p style="color: #64748b; font-size: 13px; margin-bottom: 0;">
          This settlement has been applied to your group balance on Splitter.
        </p>
      </div>
    </body>
    </html>
    """
    try:
        send_smtp_message(recipient_email, subject, text_body, html_body)
    except Exception as e:
        logger.warning(f"Could not send settlement notification to {recipient_email}: {e}")

    return {"status": "dispatched", "recipient": recipient_email}


@celery_app.task(name="send_group_invitation_notification")
def send_group_invitation_notification(
    group_name: str,
    inviter_name: str,
    recipient_email: str,
):
    """Notify a user that they were added to a group."""
    logger.info(
        f"[NOTIFICATION] User {recipient_email} added to group '{group_name}' by {inviter_name}"
    )
    if not recipient_email:
        return {"status": "skipped", "reason": "empty_recipient"}

    subject = f"You were added to '{group_name}' on Splitter"
    text_body = (
        f"Hi,\n\n"
        f"{inviter_name} added you to the group '{group_name}' on Splitter.\n\n"
        f"Log in to Splitter to view shared expenses and balances.\n\n"
        f"— The Splitter Team"
    )
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b1120; color: #f8fafc; padding: 40px 20px;">
      <div style="max-width: 480px; margin: 0 auto; background: #1e293b; border-radius: 16px; border: 1px solid #334155; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
        <div style="display: flex; align-items: center; margin-bottom: 24px;">
          <span style="font-size: 24px; font-weight: 800; background: linear-gradient(135deg, #10b981, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Splitter</span>
        </div>
        <h2 style="font-size: 20px; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 8px;">You've been added to a group</h2>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
          <strong style="color: #f1f5f9;">{inviter_name}</strong> added you to the group <strong style="color: #38bdf8;">{group_name}</strong> on Splitter.
        </p>
        <p style="color: #64748b; font-size: 13px; margin-bottom: 0;">
          Log in to your Splitter dashboard to view group expenses and balances.
        </p>
      </div>
    </body>
    </html>
    """
    try:
        send_smtp_message(recipient_email, subject, text_body, html_body)
    except Exception as e:
        logger.warning(f"Could not send group invitation notification to {recipient_email}: {e}")

    return {"status": "dispatched", "recipient": recipient_email}

