import emails
from emails.template import JinjaTemplate
from pathlib import Path
from typing import Any, Dict, List

from app.config import settings

def send_email(
    email_to: str,
    subject_template: str = "",
    html_template: str = "",
    environment: Dict[str, Any] = {},
) -> None:
    message = emails.Message(
        subject=JinjaTemplate(subject_template),
        html=JinjaTemplate(html_template),
        mail_from=(settings.EMAILS_FROM_NAME, settings.EMAILS_FROM_EMAIL),
    )
    smtp_options = {"host": settings.SMTP_HOST, "port": settings.SMTP_PORT}
    if settings.SMTP_TLS:
        smtp_options["tls"] = True
    if settings.SMTP_USER:
        smtp_options["user"] = settings.SMTP_USER
    if settings.SMTP_PASSWORD:
        smtp_options["password"] = settings.SMTP_PASSWORD
    response = message.send(to=email_to, render=environment, smtp=smtp_options)
    return response

def send_booking_confirmation_email(
    email_to: str,
    booking: Dict[str, Any],
    bus: Dict[str, Any],
    seats: List[str],
) -> None:
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - Xác nhận đặt vé #{booking.booking_code}"
    
    with open(Path(settings.EMAIL_TEMPLATES_DIR) / "booking_confirmation.html") as f:
        template_str = f.read()
    
    send_email(
        email_to=email_to,
        subject_template=subject,
        html_template=template_str,
        environment={
            "project_name": settings.PROJECT_NAME,
            "booking": booking,
            "bus": bus,
            "seats": seats
        },
    )