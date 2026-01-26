"""
Calendar Notification Service Module
====================================

This module provides notification functionality for informing companies
about new calendars being created in the system.

REQ-15: Notification System - Notify Companies about New Calendars

When a new calendar is created, all active companies are notified via email
with information about the calendar, submission dates, and how to submit proposals.

Author: PhaseThree Team
"""

import logging
from typing import List, Optional, Dict, Any
from datetime import date

from django.conf import settings
from django.core.mail import send_mail

from api.models import Company, Calendar, Proposal, Representative

logger = logging.getLogger(__name__)


class CalendarNotificationService:
    """
    Service for sending calendar creation notifications to companies.
    
    This service notifies companies when new calendars are created, allowing
    them to prepare and submit proposals for the upcoming academic period.
    """

    def __init__(self):
        self.frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        self.from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', settings.EMAIL_HOST_USER)

    def notify_companies_new_calendar(
        self,
        calendar: Calendar,
        companies: Optional[List[Company]] = None
    ) -> Dict[str, Any]:
        """
        Notify companies about a newly created calendar.
        
        Args:
            calendar: Calendar instance that was just created
            companies: Optional list of specific companies to notify.
                      If None, notifies all active companies.
        
        Returns:
            Dictionary with notification results (successful, failed counts)
        """
        logger.info(f"Notifying companies about new calendar: {calendar}")
        
        # Get companies to notify
        if companies is None:
            companies = self._get_companies_to_notify(calendar)
        
        if not companies:
            logger.info("No companies to notify")
            return {
                "total": 0,
                "successful": 0,
                "failed": 0,
                "errors": []
            }
        
        results = {
            "total": len(companies),
            "successful": 0,
            "failed": 0,
            "errors": []
        }
        
        # Send notifications
        for company in companies:
            try:
                success = self._send_calendar_notification(company, calendar)
                if success:
                    results["successful"] += 1
                else:
                    results["failed"] += 1
                    results["errors"].append({
                        "company_id": company.id_company,
                        "company_name": company.company_name,
                        "error": "Failed to send email"
                    })
            except Exception as e:
                results["failed"] += 1
                results["errors"].append({
                    "company_id": company.id_company,
                    "company_name": company.company_name,
                    "error": str(e)
                })
                logger.error(f"Error notifying company {company.id_company}: {str(e)}")
        
        logger.info(
            f"Calendar notification completed: {results['successful']}/{results['total']} successful"
        )
        
        return results

    def _get_companies_to_notify(self, calendar: Calendar) -> List[Company]:
        """
        Get list of companies that should be notified about the new calendar.
        
        Strategy:
        1. Get all active companies
        2. Optionally filter to companies that have submitted proposals for similar courses
        3. Return unique list
        
        Args:
            calendar: Calendar instance
            
        Returns:
            List of Company instances to notify
        """
        # Get all active companies
        companies = Company.objects.filter(active=True).select_related('company_admin')
        
        # Optionally: Filter to companies that have previously submitted proposals
        # for courses in the same scientific area or same course
        # For now, we'll notify all active companies
        
        return list(companies.distinct())

    def _send_calendar_notification(
        self,
        company: Company,
        calendar: Calendar
    ) -> bool:
        """
        Send calendar notification email to a company.
        
        Args:
            company: Company instance
            calendar: Calendar instance
            
        Returns:
            True if email sent successfully, False otherwise
        """
        # Get recipient email (prefer company admin, fallback to company email)
        recipient_email = company.company_email
        
        if company.company_admin and company.company_admin.user.email:
            recipient_email = company.company_admin.user.email
        
        # Build email content
        subject = self._build_subject(calendar)
        body = self._build_email_body(company, calendar)
        
        try:
            send_mail(
                subject=subject,
                message=body,
                from_email=self.from_email,
                recipient_list=[recipient_email],
                fail_silently=False,
            )
            
            logger.info(f"Calendar notification sent to {company.company_name} ({recipient_email})")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send calendar notification to {company.company_name}: {str(e)}")
            return False

    def _build_subject(self, calendar: Calendar) -> str:
        """Build email subject line."""
        return f"Novo Calendário de Estágios e Projetos - {calendar.calendar_year}/{calendar.calendar_year+1} - {calendar.calendar_semester}º Semestre"

    def _build_email_body(self, company: Company, calendar: Calendar) -> str:
        """Build email body content in Portuguese."""
        course = calendar.course
        
        # Format dates
        submission_start_str = calendar.submission_start.strftime("%d/%m/%Y")
        submission_end_str = calendar.submission_end.strftime("%d/%m/%Y")
        divulgation_str = calendar.divulgation.strftime("%d/%m/%Y")
        placements_str = calendar.placements.strftime("%d/%m/%Y")
        
        # Build course information
        course_info = f"{course.course_name}"
        if course.course_description:
            course_info += f"\n{course.course_description}"
        
        # Build commission contact info
        commission_info = ""
        if course.commission_email:
            commission_info = f"\nEmail da Comissão: {course.commission_email}"
        elif course.responsible:
            commission_info = f"\nResponsável: {course.responsible.teacher_name}\nEmail: {course.responsible.user.email}"
        
        body = f"""
Caro(a) {company.company_name},

Informamos que foi criado um novo calendário para submissão de propostas de estágios e projetos no Sistema de Gestão de Estágios e Projetos do ISEC.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 INFORMAÇÕES DO CALENDÁRIO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ano Letivo: {calendar.calendar_year}/{calendar.calendar_year+1}
Semestre: {calendar.calendar_semester}º Semestre
Curso: {course_info}{commission_info}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 DATAS IMPORTANTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• Início de Submissão: {submission_start_str}
• Fim de Submissão: {submission_end_str}
• Divulgação: {divulgation_str}
• Colocações: {placements_str}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 INFORMAÇÕES SOBRE PROPOSTAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Número mínimo de propostas por candidatura: {calendar.min_proposals}
Número máximo de propostas por candidatura: {calendar.max_proposals}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 PRÓXIMOS PASSOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Aceda à plataforma para submeter as suas propostas
2. Prepare as informações necessárias para cada proposta
3. Submeta as propostas dentro do prazo estabelecido

Aceda à plataforma: {self.frontend_url}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Agradecemos a sua colaboração e ficamos à disposição para qualquer esclarecimento.

Com os melhores cumprimentos,
Sistema de Gestão de Estágios e Projetos
Instituto Superior de Engenharia de Coimbra
"""
        
        return body.strip()

    def notify_specific_companies(
        self,
        calendar: Calendar,
        company_ids: List[int]
    ) -> Dict[str, Any]:
        """
        Notify specific companies by ID about a new calendar.
        
        Args:
            calendar: Calendar instance
            company_ids: List of company IDs to notify
            
        Returns:
            Dictionary with notification results
        """
        companies = Company.objects.filter(
            id_company__in=company_ids,
            active=True
        )
        
        return self.notify_companies_new_calendar(calendar, list(companies))
