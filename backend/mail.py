import urllib.request
import json
import os

API_KEY = os.environ.get("BREVO_API_KEY", "")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "irshatri30126@gmail.com")
SENDER_NAME = os.environ.get("SENDER_NAME", "AssetFlow Support")

def send_smtp_email(to_email: str, subject: str, html_content: str):
    # Relies on Brevo REST API using the v3 API Key
    url = "https://api.brevo.com/v3/smtp/email"
    headers = {
        "api-key": API_KEY,
        "Content-Type": "application/json",
        "accept": "application/json"
    }
    payload = {
        "sender": {"name": SENDER_NAME, "email": SENDER_EMAIL},
        "to": [{"email": to_email}],
        "subject": subject,
        "htmlContent": html_content
    }
    
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST"
    )
    try:
        with urllib.request.urlopen(req) as response:
            response.read()
        return True
    except Exception as e:
        print(f"Brevo API error sending email to {to_email}: {e}")
        return False

def send_welcome_email(to_email: str, name: str):
    subject = "Welcome to AssetFlow!"
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #1f2937; margin-bottom: 16px;">Welcome to AssetFlow!</h2>
        <p style="color: #4b5563; line-height: 1.6;">Hello {name},</p>
        <p style="color: #4b5563; line-height: 1.6;">Your employee account has been successfully created. We are excited to have you on board!</p>
        <p style="color: #4b5563; line-height: 1.6;">With AssetFlow, you can easily:</p>
        <ul style="color: #4b5563; line-height: 1.6; padding-left: 20px;">
            <li>Request new physical or digital assets</li>
            <li>Reserve shared resources & equipment</li>
            <li>Track your assigned allocations and their return dates</li>
            <li>Submit and monitor maintenance requests for your assets</li>
        </ul>
        <div style="margin: 24px 0; text-align: center;">
            <a href="http://localhost:5173/login" style="display: inline-block; padding: 12px 24px; color: #ffffff; background-color: #0d9488; text-decoration: none; border-radius: 6px; font-weight: 500;">Get Started / Log In</a>
        </div>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">This is an automated message. Please do not reply directly to this email.</p>
    </div>
    """
    return send_smtp_email(to_email, subject, html_content)
