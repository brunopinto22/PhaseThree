"""
Placement Results Processing and Notification Module
=====================================================

This module handles the processing of placement results and triggers
notifications to all relevant stakeholders when placements are finalized.

The module is triggered by the daily Celery beat scheduler when a calendar's
placement date matches the current date.

Stakeholders notified:
- Students (accepted or rejected)
- Companies (summary of accepted students)
- Teachers/Advisors (summary of assigned orientations)

Author: PhaseThree Team
"""

import logging
from collections import defaultdict
from typing import Dict, List, Any, Optional

from django.db import transaction
from django.db.models import Prefetch

from django.utils import timezone
from django.db.models import Count, Q
from api.models import *

from api.models import (
    Calendar,
    Candidature,
    CandidatureProposal,
    Proposal,
    Student,
    Company,
    Teacher,
    Settings,
)
from api.services.notifications import NotificationService

logger = logging.getLogger(__name__)


class PlacementNotificationProcessor:
    """
    Processor for placement result notifications.
    
    This class orchestrates the notification workflow for placement results,
    ensuring all stakeholders receive appropriate notifications.
    """

    def __init__(self, calendar: Calendar):
        self.calendar = calendar
        self.notification_service = NotificationService()
        
        # Load notification settings
        self.settings = Settings.objects.first()
        self.notify_students = getattr(self.settings, 'notify_placement_students', True) if self.settings else True
        self.notify_companies = getattr(self.settings, 'notify_placement_companies', True) if self.settings else True
        self.notify_advisors = getattr(self.settings, 'notify_placement_advisors', True) if self.settings else True
        
        # Tracking data structures
        self.placed_students: Dict[int, Dict[str, Any]] = {}  # student_id -> placement info
        self.rejected_students: List[Student] = []
        self.company_placements: Dict[int, List[Dict[str, Any]]] = defaultdict(list)  # company_id -> placements
        self.advisor_orientations: Dict[int, List[Dict[str, Any]]] = defaultdict(list)  # teacher_id -> orientations

    def process(self) -> Dict[str, Any]:
        """
        Main processing method that orchestrates the entire notification workflow.
        
        Returns:
            Dictionary with processing results and statistics
        """
        logger.info(f"Starting placement notification processing for calendar: {self.calendar}")
        logger.info(f"Notification settings - Students: {self.notify_students}, Companies: {self.notify_companies}, Advisors: {self.notify_advisors}")
        
        try:
            # Step 1: Gather all placement data
            self._gather_placement_data()
            
            # Step 2: Send notifications to students (if enabled)
            if self.notify_students:
                self._notify_students()
            else:
                logger.info("Student notifications disabled in settings")
            
            # Step 3: Send notifications to companies (if enabled)
            if self.notify_companies:
                self._notify_companies()
            else:
                logger.info("Company notifications disabled in settings")
            
            # Step 4: Send notifications to advisors (if enabled)
            if self.notify_advisors:
                self._notify_advisors()
            else:
                logger.info("Advisor notifications disabled in settings")
            
            # Step 5: Get summary
            summary = self.notification_service.get_summary()
            summary['calendar'] = str(self.calendar)
            summary['placed_students'] = len(self.placed_students)
            summary['rejected_students'] = len(self.rejected_students)
            summary['companies_notified'] = len(self.company_placements) if self.notify_companies else 0
            summary['advisors_notified'] = len(self.advisor_orientations) if self.notify_advisors else 0
            summary['settings'] = {
                'notify_students': self.notify_students,
                'notify_companies': self.notify_companies,
                'notify_advisors': self.notify_advisors,
            }
            
            logger.info(f"Placement notification processing completed: {summary}")
            return summary
            
        except Exception as e:
            logger.exception(f"Error processing placement notifications: {str(e)}")
            raise

    def _gather_placement_data(self):
        """
        Gather all placement data from candidatures and proposals.
        
        This method processes:
        - Candidatures with 'placed' state (successful placements)
        - Candidatures with other states after placement date (rejections)
        - Proposals with assigned students
        """
        logger.info("Gathering placement data...")
        
        # Get all candidatures for this calendar
        # A candidature is linked to students who are linked to the calendar
        students_in_calendar = Student.objects.filter(calendar=self.calendar)
        
        candidatures = Candidature.objects.filter(
            student__in=students_in_calendar
        ).select_related(
            'student',
            'student__user',
            'student__student_course',
        ).prefetch_related(
            Prefetch(
                'candidature_proposals',
                queryset=CandidatureProposal.objects.select_related(
                    'proposal',
                    'proposal__company',
                    'proposal__isec_advisor',
                    'proposal__company_advisor',
                )
            )
        )
        
        for candidature in candidatures:
            student = candidature.student
            
            # Check if student has an accepted candidature proposal
            accepted_proposal = None
            for cp in candidature.candidature_proposals.all():
                if cp.state == 'accepted':
                    accepted_proposal = cp.proposal
                    break
            
            if accepted_proposal and candidature.state == 'placed':
                # Student was placed
                self.placed_students[student.student_number] = {
                    'student': student,
                    'proposal': accepted_proposal,
                    'candidature': candidature,
                }
                
                # Track for company notification
                if accepted_proposal.company:
                    company_id = accepted_proposal.company.id_company
                    self._add_to_company_placements(company_id, accepted_proposal, student)
                
                # Track for advisor notification
                if accepted_proposal.isec_advisor:
                    advisor_id = accepted_proposal.isec_advisor.id_teacher
                    self._add_to_advisor_orientations(advisor_id, accepted_proposal, student)
                    
            elif candidature.state in ['submitted', 'revision']:
                # Student was not placed (all their candidature proposals were rejected or pending)
                self.rejected_students.append(student)
        
        logger.info(
            f"Data gathered: {len(self.placed_students)} placed, "
            f"{len(self.rejected_students)} rejected"
        )

    def _add_to_company_placements(self, company_id: int, proposal: Proposal, student: Student):
        """Add a placement to company tracking structure."""
        # Find existing proposal entry or create new one
        for entry in self.company_placements[company_id]:
            if entry['proposal'].id_proposal == proposal.id_proposal:
                entry['students'].append(student)
                return
        
        # New proposal entry
        self.company_placements[company_id].append({
            'proposal': proposal,
            'students': [student]
        })

    def _add_to_advisor_orientations(self, teacher_id: int, proposal: Proposal, student: Student):
        """Add an orientation to advisor tracking structure."""
        # Find existing proposal entry or create new one
        for entry in self.advisor_orientations[teacher_id]:
            if entry['proposal'].id_proposal == proposal.id_proposal:
                entry['students'].append(student)
                return
        
        # New proposal entry
        self.advisor_orientations[teacher_id].append({
            'proposal': proposal,
            'students': [student]
        })

    def _notify_students(self):
        """Send notifications to all students about their placement results."""
        logger.info("Sending notifications to students...")
        
        # Notify placed students
        for student_number, placement_info in self.placed_students.items():
            student = placement_info['student']
            proposal = placement_info['proposal']
            
            try:
                self.notification_service.notify_student_placement_accepted(
                    student=student,
                    proposal=proposal,
                    calendar=self.calendar
                )
            except Exception as e:
                logger.error(f"Failed to notify placed student {student_number}: {str(e)}")
        
        # Notify rejected students
        for student in self.rejected_students:
            try:
                # Get the student's candidature
                candidature = Candidature.objects.filter(
                    student=student
                ).prefetch_related('candidature_proposals__proposal').first()
                
                if candidature:
                    self.notification_service.notify_student_placement_rejected(
                        student=student,
                        candidature=candidature,
                        calendar=self.calendar
                    )
            except Exception as e:
                logger.error(f"Failed to notify rejected student {student.student_number}: {str(e)}")

    def _notify_companies(self):
        """Send notifications to all companies about their accepted students."""
        logger.info("Sending notifications to companies...")
        
        for company_id, placements in self.company_placements.items():
            try:
                company = Company.objects.get(id_company=company_id)
                self.notification_service.notify_company_placements(
                    company=company,
                    calendar=self.calendar,
                    placements=placements
                )
            except Company.DoesNotExist:
                logger.error(f"Company {company_id} not found")
            except Exception as e:
                logger.error(f"Failed to notify company {company_id}: {str(e)}")

    def _notify_advisors(self):
        """Send notifications to all advisors about their assigned orientations."""
        logger.info("Sending notifications to advisors...")
        
        for teacher_id, orientations in self.advisor_orientations.items():
            try:
                teacher = Teacher.objects.select_related('user').get(id_teacher=teacher_id)
                self.notification_service.notify_advisor_placements(
                    teacher=teacher,
                    calendar=self.calendar,
                    orientations=orientations
                )
            except Teacher.DoesNotExist:
                logger.error(f"Teacher {teacher_id} not found")
            except Exception as e:
                logger.error(f"Failed to notify teacher {teacher_id}: {str(e)}")


def handle_placements(calendar_id: int) -> Optional[Dict[str, Any]]:
    """
    Main entry point for processing placement results and sending notifications.
    
    This function is called by the Celery beat scheduler when a calendar's
    placement date matches the current date.
    
    Args:
        calendar_id: Primary key of the Calendar instance
        
    Returns:
        Dictionary with processing results, or None if calendar not found
    """
    logger.info(f"handle_placements triggered for calendar_id: {calendar_id}")

    # Primeiro, executa a colocação automática (matching)
    handle_automatic_placements(calendar_id)

    try:
        calendar = Calendar.objects.select_related('course').get(id_calendar=calendar_id)
    except Calendar.DoesNotExist:
        logger.error(f"Calendar with id {calendar_id} not found.")
        return None

    logger.info(f"Processing placements for: {calendar}")

    # Depois, processa as notificações normalmente
    processor = PlacementNotificationProcessor(calendar)
    result = processor.process()

    return result


def send_placement_notifications_manual(calendar_id: int) -> Optional[Dict[str, Any]]:
    """
    Manual trigger for placement notifications.
    
    This function can be called from the admin panel or API endpoint
    to manually trigger placement notifications for a specific calendar.
    
    Args:
        calendar_id: Primary key of the Calendar instance
        
    Returns:
        Dictionary with processing results, or None if calendar not found
    """
    logger.info(f"Manual placement notification triggered for calendar_id: {calendar_id}")
    return handle_placements(calendar_id)


def handle_automatic_placements(calendar_id):
    """
    Sistema de colocação automática baseado em:
    1. Média do aluno (maior média = maior prioridade)
    2. Data de submissão da candidatura (desempate)
    3. Prioridade das propostas do aluno (1ª, 2ª, 3ª escolha)
    4. Vagas disponíveis nas propostas
    """
    calendar = None
    try:
        calendar = Calendar.objects.get(id_calendar=calendar_id)
    except Calendar.DoesNotExist:
        print(f">> Calendar with id {calendar_id} not found.")
        return
    
    print(f">> Iniciando colocação automática para {calendar.__str__()}")
    
    # 1. Buscar todas as candidaturas submetidas do calendário
    candidatures = Candidature.objects.filter(
        student__calendar=calendar,
        state='submitted'
    ).select_related('student').order_by(
        '-student__average',  # Maior média primeiro
        'candidature_submission_date'  # Data mais antiga como desempate
    )
    
    total_candidatures = candidatures.count()
    print(f"   >> Total de candidaturas: {total_candidatures}")
    
    placed_count = 0
    rejected_count = 0
    
    # 2. Processar cada candidatura em ordem de prioridade
    for candidature in candidatures:
        student = candidature.student
        print(f"   >> Processando: {student.student_name} (média: {student.average})")
        
        # 3. Obter propostas da candidatura ordenadas por prioridade
        proposals = candidature.candidature_proposals.filter(
            state='pending'
        ).select_related('proposal').order_by('priority')
        
        colocado = False
        
        # 4. Tentar colocar em cada proposta (por ordem de prioridade)
        for candidature_proposal in proposals:
            proposal = candidature_proposal.proposal
            
            # Verificar vagas disponíveis
            slots_ocupados = CandidatureProposal.objects.filter(
                proposal=proposal,
                state='placed'
            ).count()
            
            vagas_disponiveis = proposal.slots - slots_ocupados
            
            if vagas_disponiveis > 0:
                # COLOCAR ALUNO
                candidature.state = 'placed'
                candidature.placed_proposal = proposal
                candidature.placement_attempt += 1
                candidature.save()
                
                # Marcar esta proposta como 'placed'
                candidature_proposal.state = 'placed'
                candidature_proposal.state_changed_at = timezone.now()
                candidature_proposal.save()
                
                # Registrar no histórico
                candidature.change_state(
                    new_state='placed',
                    changed_by=None,
                    notes=f'Colocado automaticamente na proposta {proposal.proposal_title} (prioridade {candidature_proposal.priority})'
                )
                
                placed_count += 1
                colocado = True
                print(f"      ✓ Colocado na proposta {proposal.id_proposal} (prioridade {candidature_proposal.priority})")
                break  # Sair do loop - aluno já foi colocado
            else:
                print(f"      ✗ Sem vagas na proposta {proposal.id_proposal} (prioridade {candidature_proposal.priority})")
        
        # 5. Se não conseguiu colocar em nenhuma proposta
        if not colocado:
            candidature.state = 'rejected'
            candidature.save()
            
            # Marcar todas as propostas como rejected
            candidature.candidature_proposals.filter(
                state='pending'
            ).update(state='rejected', state_changed_at=timezone.now())
            
            # Registrar no histórico
            candidature.change_state(
                new_state='rejected',
                changed_by=None,
                notes='Sem vagas disponíveis em nenhuma das propostas selecionadas'
            )
            
            rejected_count += 1
            print(f"      ✗ Não colocado (sem vagas)")
    
    print(f">> Colocação automática concluída para {calendar.__str__()}")
    print(f"   >> Total: {placed_count} alunos colocados, {rejected_count} alunos sem colocação")


# def handle_placements(calendar_id):
#     """
#     FUNÇÃO LEGADA - Mantida para retrocompatibilidade.
#     Agora apenas chama a colocação automática.
#     """
#     print(">> AVISO: Usando novo sistema de colocação automática")
#     handle_automatic_placements(calendar_id)