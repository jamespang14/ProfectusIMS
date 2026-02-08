import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

import threading

def send_email_sync(subject: str, body: str):
    """
    Sends an email using SMTP configuration from environment variables.
    Blocking function.
    """
    smtp_server = os.getenv("SMTP_SERVER")
    smtp_port = os.getenv("SMTP_PORT", 587)
    smtp_username = os.getenv("SMTP_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD")
    receiver_email = os.getenv("ALERT_RECEIVER_EMAIL")
    sender_email = os.getenv("SENDER_EMAIL", smtp_username)

    if not all([smtp_server, smtp_username, smtp_password, receiver_email]):
        logger.warning("SMTP configuration is incomplete. Email not sent.")
        return

    try:
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = receiver_email
        msg['Subject'] = subject

        msg.attach(MIMEText(body, 'plain'))

        with smtplib.SMTP(smtp_server, int(smtp_port)) as server:
            server.starttls()
            server.login(smtp_username, smtp_password)
            server.send_message(msg)
        
        logger.info(f"Email sent successfully to {receiver_email}")
        
    except Exception as e:
        logger.error(f"Failed to send email: {e}")

def send_email(subject: str, body: str):
    """
    Non-blocking wrapper for send_email_sync.
    Starts a new thread to send the email.
    """
    email_thread = threading.Thread(target=send_email_sync, args=(subject, body))
    email_thread.start()
