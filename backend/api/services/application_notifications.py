"""
Application Results Notification Service Module
===============================================

This module provides notification functionality for informing companies
when students submit candidatures (applications) to their proposals.

REQ-16: Notification System - Notify Companies about Application Results

When a student submits a candidature with proposals, all companies whose
proposals are included receive an email notification with student information
and application details.

Author: PhaseThree Team
"""

import logging
from typing import List, Optional, Dict, Any
from collections import defaultdict
from datetime import date

from django.conf import settings
from django.core.mail import send_mail

from api.models import Company, Candidature, CandidatureProposal, Proposal, Representative

logger = logging.getLogger(__name__)


class ApplicationNotificationService:
    """
    Service for sending application/candidature notifications to companies.
    
    This service notifies companies when students submit candidatures
    that include their proposals, allowing companies to review applications.
    """

    def __init__(self):
        self.frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        self.from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', settings.EMAIL_HOST_USER)

    def notify_companies_application_submitted(
        self,
        candidature: Candidature
    ) -> Dict[str, Any]:
        """
        Notify companies about a newly submitted candidature.
        
        This method groups proposals by company and sends one notification
        per company with all their proposals included in the candidature.
        
        Args:
            candidature: Candidature instance that was just submitted
        
        Returns:
            Dictionary with notification results (successful, failed counts)
        """
        logger.info(f"Notifying companies about candidature {candidature.id_candidature}")
        
        # Get all proposals in this candidature
        candidature_proposals = CandidatureProposal.objects.filter(
            candidature=candidature
        ).select_related(
            'proposal',
            'proposal__company',
            'proposal__company__company_admin',
            'candidature__student',
            'candidature__student__user',
            'candidature__student__student_course',
            'candidature__student__student_branch'
        )
        
        # Group proposals by company
        company_proposals = defaultdict(list)
        for cp in candidature_proposals:
            proposal = cp.proposal
            if proposal.company:  # Only notify for company proposals (not ISEC projects)
                company_id = proposal.company.id_company
                company_proposals[company_id].append({
                    'proposal': proposal,
                    'candidature_proposal': cp
                })
        
        if not company_proposals:
            logger.info("No company proposals in candidature to notify about")
            return {
                "total": 0,
                "successful": 0,
                "failed": 0,
                "errors": []
            }
        
        results = {
            "total": len(company_proposals),
            "successful": 0,
            "failed": 0,
            "errors": []
        }
        
        # Send notification to each company
        for company_id, proposals_data in company_proposals.items():
            try:
                company = proposals_data[0]['proposal'].company
                success = self._send_application_notification(
                    company,
                    candidature,
                    proposals_data
                )
                
                if success:
                    results["successful"] += 1
                else:
                    results["failed"] += 1
                    results["errors"].append({
                        "company_id": company_id,
                        "company_name": company.company_name,
                        "error": "Failed to send email"
                    })
            except Exception as e:
                results["failed"] += 1
                results["errors"].append({
                    "company_id": company_id,
                    "error": str(e)
                })
                logger.error(f"Error notifying company {company_id}: {str(e)}")
        
        logger.info(
            f"Application notification completed: {results['successful']}/{results['total']} successful"
        )
        
        return results

    def _send_application_notification(
        self,
        company: Company,
        candidature: Candidature,
        proposals_data: List[Dict[str, Any]]
    ) -> bool:
        """
        Send application notification email to a company.
        
        Args:
            company: Company instance
            candidature: Candidature instance
            proposals_data: List of dicts with 'proposal' and 'candidature_proposal' keys
            
        Returns:
            True if email sent successfully, False otherwise
        """
        # Get recipient email (prefer company admin, fallback to company email)
        recipient_email = company.company_email
        
        if company.company_admin and company.company_admin.user.email:
            recipient_email = company.company_admin.user.email
        
        # Build email content
        subject = self._build_subject(candidature, company)
        body = self._build_email_body(company, candidature, proposals_data)
        
        try:
            send_mail(
                subject=subject,
                message=body,
                from_email=self.from_email,
                recipient_list=[recipient_email],
                fail_silently=False,
            )
            
            logger.info(f"Application notification sent to {company.company_name} ({recipient_email})")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send application notification to {company.company_name}: {str(e)}")
            return False

    def _build_subject(self, candidature: Candidature, company: Company) -> str:
        """Build email subject line."""
        student = candidature.student
        return f"Nova Candidatura Recebida - {student.student_name} (Nº {student.student_number})"

    def _build_email_body(
        self,
        company: Company,
        candidature: Candidature,
        proposals_data: List[Dict[str, Any]]
    ) -> str:
        """Build email body content in Portuguese."""
        student = candidature.student
        calendar = proposals_data[0]['proposal'].calendar
        
        # Format dates
        submission_date_str = candidature.candidature_submission_date.strftime("%d/%m/%Y")
        
        # Build proposals list
        proposals_list_items = []
        for item in proposals_data:
            proposal = item['proposal']
            proposal_type = "Estágio" if proposal.proposal_type == 1 else "Projeto"
            proposals_list_items.append(
                f"• {proposal.proposal_title} ({proposal_type})"
            )
        
        proposals_list = "\n".join(proposals_list_items)
        
        # Build student information
        course_info = student.student_course.course_name
        if student.student_branch:
            course_info += f" - {student.student_branch.branch_name}"
        
        # Build email body
        body = f"""
Caro(a) {company.company_name},

Informamos que recebeu uma nova candidatura de um aluno para as suas propostas de estágio/projeto.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 INFORMAÇÕES DO ALUNO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Nome: {student.student_name}
Número de Aluno: {student.student_number}
Email: {student.user.email}
Curso: {course_info}
Média: {student.average if student.average else "Não disponível"}
ECTS: {student.student_ects if student.student_ects else "Não disponível"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 PROPOSTAS CANDIDATADAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

O aluno candidatou-se às seguintes propostas da {company.company_name}:

{proposals_list}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 INFORMAÇÕES DA CANDIDATURA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Data de Submissão: {submission_date_str}
Calendário: {calendar.calendar_year}/{calendar.calendar_year+1} - {calendar.calendar_semester}º Semestre

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 PRÓXIMOS PASSOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Aceda à plataforma para consultar os detalhes completos da candidatura
2. Revise o perfil do aluno e o seu currículo (se disponível)
3. Avalie a candidatura e tome uma decisão

Aceda à plataforma: {self.frontend_url}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Agradecemos a sua atenção e aguardamos a sua avaliação.

Com os melhores cumprimentos,
Sistema de Gestão de Estágios e Projetos
Instituto Superior de Engenharia de Coimbra
"""
        
        return body.strip()
