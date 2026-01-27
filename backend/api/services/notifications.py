"""
Notification Service Module
===========================

This module provides a centralized notification service for the ISEC Internship
and Project Partnerships Management System.

Features:
- Email notifications for placement results
- Support for multiple notification types
- Async-ready with Celery integration
- Comprehensive logging and error handling
- Portuguese language templates

Author: PhaseThree Team
"""

import logging
from typing import List, Optional, Dict, Any
from dataclasses import dataclass
from enum import Enum

from django.conf import settings
from django.core.mail import send_mail, send_mass_mail, EmailMessage
from django.template import Template, Context

logger = logging.getLogger(__name__)


class NotificationType(Enum):
    """Enumeration of notification types supported by the system."""
    PLACEMENT_ACCEPTED = "placement_accepted"
    PLACEMENT_REJECTED = "placement_rejected"
    PLACEMENT_SUMMARY_COMPANY = "placement_summary_company"
    PLACEMENT_SUMMARY_ADVISOR = "placement_summary_advisor"
    PLACEMENT_RESULTS_AVAILABLE = "placement_results_available"
    CANDIDATURE_STATUS_CHANGED = "candidature_status_changed"


@dataclass
class NotificationResult:
    """Result of a notification attempt."""
    success: bool
    recipient: str
    notification_type: NotificationType
    error_message: Optional[str] = None


class EmailTemplates:
    """
    Email templates for the notification system.
    All templates are in Portuguese as per ISEC requirements.
    """

    # =========================================================================
    # PLACEMENT RESULTS - STUDENT NOTIFICATIONS
    # =========================================================================

    PLACEMENT_ACCEPTED_SUBJECT = "Colocação Confirmada - {proposal_title}"
    PLACEMENT_ACCEPTED_BODY = """
Caro(a) {student_name},

Temos o prazer de informar que a sua candidatura foi aceite e foi colocado(a) na seguinte proposta:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 DETALHES DA COLOCAÇÃO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Proposta: {proposal_title}
Tipo: {proposal_type}
Empresa/Instituição: {company_name}
Local: {location}
Formato: {work_format}

{advisor_section}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 PRÓXIMOS PASSOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Aceda à plataforma para consultar os detalhes completos
2. Aguarde o contacto do seu orientador
3. O protocolo será gerado e enviado para assinatura

Aceda à plataforma: {frontend_url}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Parabéns pela sua colocação!

Com os melhores cumprimentos,
Sistema de Gestão de Estágios e Projetos
Instituto Superior de Engenharia de Coimbra
"""

    PLACEMENT_REJECTED_SUBJECT = "Resultado da Candidatura - {calendar_title}"
    PLACEMENT_REJECTED_BODY = """
Caro(a) {student_name},

Informamos que o processo de colocações para o calendário "{calendar_title}" foi concluído.

Infelizmente, não foi possível efetuar a sua colocação em nenhuma das propostas às quais se candidatou nesta fase.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 RESUMO DAS SUAS CANDIDATURAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{proposals_list}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 INFORMAÇÃO IMPORTANTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Recomendamos que contacte a comissão de estágios do seu curso para mais informações sobre alternativas disponíveis.

Aceda à plataforma: {frontend_url}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Com os melhores cumprimentos,
Sistema de Gestão de Estágios e Projetos
Instituto Superior de Engenharia de Coimbra
"""

    # =========================================================================
    # PLACEMENT RESULTS - COMPANY NOTIFICATIONS
    # =========================================================================

    PLACEMENT_SUMMARY_COMPANY_SUBJECT = "Colocações Confirmadas - {calendar_title}"
    PLACEMENT_SUMMARY_COMPANY_BODY = """
Caro(a) {representative_name},

Informamos que o processo de colocações para o calendário "{calendar_title}" foi concluído.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 ALUNOS COLOCADOS NAS PROPOSTAS DA {company_name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{placements_list}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 RESUMO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total de propostas: {total_proposals}
Vagas preenchidas: {filled_slots}
Vagas disponíveis: {available_slots}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 PRÓXIMOS PASSOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Entre em contacto com os alunos colocados
2. O protocolo será gerado e enviado para assinatura
3. Coordene com o orientador do ISEC atribuído

Aceda à plataforma: {frontend_url}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Com os melhores cumprimentos,
Sistema de Gestão de Estágios e Projetos
Instituto Superior de Engenharia de Coimbra
"""

    # =========================================================================
    # PLACEMENT RESULTS - TEACHER/ADVISOR NOTIFICATIONS
    # =========================================================================

    PLACEMENT_SUMMARY_ADVISOR_SUBJECT = "Orientações Atribuídas - {calendar_title}"
    PLACEMENT_SUMMARY_ADVISOR_BODY = """
Caro(a) Professor(a) {teacher_name},

Informamos que o processo de colocações para o calendário "{calendar_title}" foi concluído.

Foi-lhe atribuída a orientação dos seguintes estágios/projetos:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 ORIENTAÇÕES ATRIBUÍDAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{orientations_list}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 RESUMO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total de orientações: {total_orientations}
Alunos sob orientação: {total_students}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 PRÓXIMOS PASSOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Entre em contacto com os alunos atribuídos
2. Coordene com o orientador da empresa (se aplicável)
3. O protocolo será gerado e enviado para assinatura

Aceda à plataforma: {frontend_url}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Com os melhores cumprimentos,
Sistema de Gestão de Estágios e Projetos
Instituto Superior de Engenharia de Coimbra
"""

    # =========================================================================
    # GENERAL PLACEMENT NOTIFICATION
    # =========================================================================

    PLACEMENT_RESULTS_AVAILABLE_SUBJECT = "Resultados das Colocações Disponíveis - {calendar_title}"
    PLACEMENT_RESULTS_AVAILABLE_BODY = """
Caro(a) {recipient_name},

Informamos que os resultados das colocações para o calendário "{calendar_title}" já se encontram disponíveis na plataforma.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Aceda à plataforma para consultar os resultados: {frontend_url}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Com os melhores cumprimentos,
Sistema de Gestão de Estágios e Projetos
Instituto Superior de Engenharia de Coimbra
"""


class NotificationService:
    """
    Centralized notification service for the ISEC system.
    
    This service handles all email notifications related to:
    - Placement results (students, companies, advisors)
    - Candidature status changes
    - System announcements
    
    Usage:
        service = NotificationService()
        results = service.notify_placement_results(calendar_id)
    """

    def __init__(self):
        self.frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        self.from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', settings.EMAIL_HOST_USER)
        self._results: List[NotificationResult] = []

    def _send_email(
        self,
        recipient_email: str,
        subject: str,
        body: str,
        notification_type: NotificationType,
        fail_silently: bool = False
    ) -> NotificationResult:
        """
        Send a single email and track the result.
        
        Args:
            recipient_email: Email address of the recipient
            subject: Email subject line
            body: Email body content
            notification_type: Type of notification being sent
            fail_silently: If True, suppress exceptions
            
        Returns:
            NotificationResult with success status and any error message
        """
        try:
            send_mail(
                subject=subject,
                message=body,
                from_email=self.from_email,
                recipient_list=[recipient_email],
                fail_silently=fail_silently,
            )
            
            result = NotificationResult(
                success=True,
                recipient=recipient_email,
                notification_type=notification_type
            )
            logger.info(f"Email sent successfully to {recipient_email} ({notification_type.value})")
            
        except Exception as e:
            result = NotificationResult(
                success=False,
                recipient=recipient_email,
                notification_type=notification_type,
                error_message=str(e)
            )
            logger.error(f"Failed to send email to {recipient_email}: {str(e)}")
        
        self._results.append(result)
        return result

    def _format_work_format(self, work_format: int) -> str:
        """Convert work format integer to Portuguese string."""
        formats = {
            1: "Presencial",
            2: "Remoto",
            3: "Híbrido"
        }
        return formats.get(work_format, str(work_format))

    def _format_proposal_type(self, proposal_type: int) -> str:
        """Convert proposal type integer to Portuguese string."""
        types = {
            1: "Estágio",
            2: "Projeto"
        }
        return types.get(proposal_type, str(proposal_type))

    def notify_student_placement_accepted(
        self,
        student,
        proposal,
        calendar
    ) -> NotificationResult:
        """
        Notify a student that they have been placed in a proposal.
        
        Args:
            student: Student model instance
            proposal: Proposal model instance
            calendar: Calendar model instance
            
        Returns:
            NotificationResult indicating success or failure
        """
        # Build advisor section
        advisor_lines = []
        if proposal.isec_advisor:
            advisor_lines.append(f"Orientador ISEC: {proposal.isec_advisor.teacher_name}")
            advisor_lines.append(f"Email: {proposal.isec_advisor.user.email}")
        if proposal.company_advisor:
            advisor_lines.append(f"Orientador Empresa: {proposal.company_advisor.representative_name}")
            advisor_lines.append(f"Email: {proposal.company_advisor.user.email}")
        
        advisor_section = ""
        if advisor_lines:
            advisor_section = "Orientadores:\n" + "\n".join(f"  • {line}" for line in advisor_lines)

        subject = EmailTemplates.PLACEMENT_ACCEPTED_SUBJECT.format(
            proposal_title=proposal.proposal_title
        )
        
        body = EmailTemplates.PLACEMENT_ACCEPTED_BODY.format(
            student_name=student.student_name,
            proposal_title=proposal.proposal_title,
            proposal_type=self._format_proposal_type(proposal.proposal_type),
            company_name=proposal.company.company_name if proposal.company else "ISEC",
            location=proposal.location,
            work_format=self._format_work_format(proposal.work_format),
            advisor_section=advisor_section,
            frontend_url=self.frontend_url
        )
        
        return self._send_email(
            recipient_email=student.user.email,
            subject=subject,
            body=body,
            notification_type=NotificationType.PLACEMENT_ACCEPTED
        )

    def notify_student_placement_rejected(
        self,
        student,
        candidature,
        calendar
    ) -> NotificationResult:
        """
        Notify a student that they were not placed in any proposal.
        
        Args:
            student: Student model instance
            candidature: Candidature model instance
            calendar: Calendar model instance
            
        Returns:
            NotificationResult indicating success or failure
        """
        # Build list of proposals the student applied to
        proposals_list_items = []
        for cp in candidature.candidature_proposals.all():
            status_icon = "❌" if cp.state == "rejected" else "⏳"
            proposals_list_items.append(
                f"{status_icon} {cp.proposal.proposal_title} - {cp.get_state_display()}"
            )
        
        proposals_list = "\n".join(proposals_list_items) if proposals_list_items else "Nenhuma candidatura registada."
        
        subject = EmailTemplates.PLACEMENT_REJECTED_SUBJECT.format(
            calendar_title=str(calendar)
        )
        
        body = EmailTemplates.PLACEMENT_REJECTED_BODY.format(
            student_name=student.student_name,
            calendar_title=str(calendar),
            proposals_list=proposals_list,
            frontend_url=self.frontend_url
        )
        
        return self._send_email(
            recipient_email=student.user.email,
            subject=subject,
            body=body,
            notification_type=NotificationType.PLACEMENT_REJECTED
        )

    def notify_company_placements(
        self,
        company,
        calendar,
        placements: List[Dict[str, Any]]
    ) -> NotificationResult:
        """
        Notify a company about all students placed in their proposals.
        
        Args:
            company: Company model instance
            calendar: Calendar model instance
            placements: List of dicts with 'proposal' and 'students' keys
            
        Returns:
            NotificationResult indicating success or failure
        """
        # Build placements list
        placements_lines = []
        total_filled = 0
        total_available = 0
        
        for placement in placements:
            proposal = placement['proposal']
            students = placement['students']
            
            placements_lines.append(f"\n📌 {proposal.proposal_title}")
            placements_lines.append(f"   Tipo: {self._format_proposal_type(proposal.proposal_type)}")
            placements_lines.append(f"   Vagas: {len(students)}/{proposal.slots}")
            
            if students:
                placements_lines.append("   Alunos colocados:")
                for student in students:
                    placements_lines.append(f"     • {student.student_name} ({student.user.email})")
                total_filled += len(students)
            else:
                placements_lines.append("   Sem alunos colocados nesta proposta.")
            
            total_available += proposal.slots - len(students)
        
        placements_list = "\n".join(placements_lines)
        
        # Get company admin or first representative
        recipient = company.company_admin if company.company_admin else company.representatives.first()
        if not recipient:
            logger.warning(f"No representative found for company {company.company_name}")
            return NotificationResult(
                success=False,
                recipient=company.company_email,
                notification_type=NotificationType.PLACEMENT_SUMMARY_COMPANY,
                error_message="No representative found for company"
            )
        
        subject = EmailTemplates.PLACEMENT_SUMMARY_COMPANY_SUBJECT.format(
            calendar_title=str(calendar)
        )
        
        body = EmailTemplates.PLACEMENT_SUMMARY_COMPANY_BODY.format(
            representative_name=recipient.representative_name,
            calendar_title=str(calendar),
            company_name=company.company_name,
            placements_list=placements_list,
            total_proposals=len(placements),
            filled_slots=total_filled,
            available_slots=total_available,
            frontend_url=self.frontend_url
        )
        
        return self._send_email(
            recipient_email=recipient.user.email,
            subject=subject,
            body=body,
            notification_type=NotificationType.PLACEMENT_SUMMARY_COMPANY
        )

    def notify_advisor_placements(
        self,
        teacher,
        calendar,
        orientations: List[Dict[str, Any]]
    ) -> NotificationResult:
        """
        Notify a teacher about all orientations assigned to them.
        
        Args:
            teacher: Teacher model instance
            calendar: Calendar model instance
            orientations: List of dicts with 'proposal' and 'students' keys
            
        Returns:
            NotificationResult indicating success or failure
        """
        # Build orientations list
        orientations_lines = []
        total_students = 0
        
        for orientation in orientations:
            proposal = orientation['proposal']
            students = orientation['students']
            
            company_info = f" ({proposal.company.company_name})" if proposal.company else ""
            orientations_lines.append(f"\n📌 {proposal.proposal_title}{company_info}")
            orientations_lines.append(f"   Tipo: {self._format_proposal_type(proposal.proposal_type)}")
            
            if students:
                orientations_lines.append("   Alunos:")
                for student in students:
                    orientations_lines.append(f"     • {student.student_name} (Nº {student.student_number})")
                    orientations_lines.append(f"       Email: {student.user.email}")
                total_students += len(students)
            
            if proposal.company_advisor:
                orientations_lines.append(f"   Orientador Empresa: {proposal.company_advisor.representative_name}")
                orientations_lines.append(f"   Email: {proposal.company_advisor.user.email}")
        
        orientations_list = "\n".join(orientations_lines)
        
        subject = EmailTemplates.PLACEMENT_SUMMARY_ADVISOR_SUBJECT.format(
            calendar_title=str(calendar)
        )
        
        body = EmailTemplates.PLACEMENT_SUMMARY_ADVISOR_BODY.format(
            teacher_name=teacher.teacher_name,
            calendar_title=str(calendar),
            orientations_list=orientations_list,
            total_orientations=len(orientations),
            total_students=total_students,
            frontend_url=self.frontend_url
        )
        
        return self._send_email(
            recipient_email=teacher.user.email,
            subject=subject,
            body=body,
            notification_type=NotificationType.PLACEMENT_SUMMARY_ADVISOR
        )

    def notify_placement_results_available(
        self,
        recipient_email: str,
        recipient_name: str,
        calendar
    ) -> NotificationResult:
        """
        Send a general notification that placement results are available.
        
        Args:
            recipient_email: Email address of the recipient
            recipient_name: Name of the recipient
            calendar: Calendar model instance
            
        Returns:
            NotificationResult indicating success or failure
        """
        subject = EmailTemplates.PLACEMENT_RESULTS_AVAILABLE_SUBJECT.format(
            calendar_title=str(calendar)
        )
        
        body = EmailTemplates.PLACEMENT_RESULTS_AVAILABLE_BODY.format(
            recipient_name=recipient_name,
            calendar_title=str(calendar),
            frontend_url=self.frontend_url
        )
        
        return self._send_email(
            recipient_email=recipient_email,
            subject=subject,
            body=body,
            notification_type=NotificationType.PLACEMENT_RESULTS_AVAILABLE
        )

    def get_results(self) -> List[NotificationResult]:
        """Get all notification results from this session."""
        return self._results.copy()

    def get_summary(self) -> Dict[str, int]:
        """Get a summary of notification results."""
        successful = sum(1 for r in self._results if r.success)
        failed = sum(1 for r in self._results if not r.success)
        
        return {
            "total": len(self._results),
            "successful": successful,
            "failed": failed,
            "by_type": {
                ntype.value: sum(1 for r in self._results if r.notification_type == ntype)
                for ntype in NotificationType
            }
        }

    def clear_results(self):
        """Clear the results list."""
        self._results.clear()
