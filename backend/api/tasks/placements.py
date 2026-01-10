from django.db import transaction
from django.core.mail import send_mail
from django.conf import settings
from collections import defaultdict
from api.models import (
    Calendar, Candidature, CandidatureProposal, CandidatureHistory,
    Student, Proposal, Company, Representative
)


def handle_placements(calendar_id):
    """
    REQ-4: Automatic student placement algorithm.
    
    Algorithm:
    1. Get all candidatures for the calendar
    2. Rank students by average (descending)
    3. For each student, try to place in their first available proposal choice
    4. Update Candidature.state to 'placed' and assign student to Proposal.students
    5. Log history with timestamp
    
    Returns a dict with placement results.
    """
    try:
        calendar = Calendar.objects.get(id_calendar=calendar_id)
    except Calendar.DoesNotExist:
        return {"error": f"Calendar with id {calendar_id} not found.", "placed": 0}
    
    print(f">> Starting placements for {calendar}")
    
    # Get all candidatures for this calendar's students
    candidatures = Candidature.objects.filter(
        student__calendar=calendar,
        state='submitted'  # Only process submitted candidatures
    ).select_related('student')
    
    if not candidatures.exists():
        return {"error": "No candidatures to process.", "placed": 0}
    
    # Sort candidatures by student average (descending)
    # Students with higher averages get priority
    sorted_candidatures = sorted(
        candidatures,
        key=lambda c: c.student.average if c.student.average else 0,
        reverse=True
    )
    
    placed_count = 0
    not_placed_count = 0
    results = []
    
    with transaction.atomic():
        for candidature in sorted_candidatures:
            student = candidature.student
            placed = False
            
            # Get student's proposal choices in order
            candidature_proposals = CandidatureProposal.objects.filter(
                candidature=candidature
            ).select_related('proposal')
            
            for cp in candidature_proposals:
                proposal = cp.proposal
                
                # Check if proposal has slots available
                slots_left = proposal.slots - proposal.students.count()
                
                if slots_left > 0:
                    # Place student in this proposal
                    proposal.students.add(student)
                    proposal.save()
                    
                    # Update candidature proposal state
                    cp.state = 'accepted'
                    cp.save()
                    
                    # Reject other proposals for this candidature
                    CandidatureProposal.objects.filter(
                        candidature=candidature
                    ).exclude(pk=cp.pk).update(state='rejected')
                    
                    # Update candidature state
                    candidature.state = 'placed'
                    candidature.save()
                    
                    # Log history (REQ-3)
                    CandidatureHistory.objects.create(
                        candidature=candidature,
                        previous_state='submitted',
                        new_state='placed',
                        changed_by=None,  # System action
                        notes=f"Colocação automática na proposta: {proposal.proposal_title}"
                    )
                    
                    placed = True
                    placed_count += 1
                    
                    results.append({
                        "student_number": student.student_number,
                        "student_name": student.student_name,
                        "average": student.average,
                        "proposal_id": proposal.id_proposal,
                        "proposal_title": proposal.proposal_title,
                        "status": "placed"
                    })
                    
                    print(f"   Placed {student.student_name} (avg: {student.average}) in {proposal.proposal_title}")
                    break
            
            if not placed:
                # No available slots in any of the student's choices
                candidature.state = 'revision'  # Move to revision for manual handling
                candidature.save()
                
                # Mark all proposals as rejected
                CandidatureProposal.objects.filter(
                    candidature=candidature
                ).update(state='rejected')
                
                # Log history
                CandidatureHistory.objects.create(
                    candidature=candidature,
                    previous_state='submitted',
                    new_state='revision',
                    changed_by=None,
                    notes="Não foi possível colocar automaticamente - todas as propostas sem vagas"
                )
                
                not_placed_count += 1
                
                results.append({
                    "student_number": student.student_number,
                    "student_name": student.student_name,
                    "average": student.average,
                    "status": "not_placed",
                    "reason": "No available slots in selected proposals"
                })
                
                print(f"   Could not place {student.student_name} - no available slots")
    
    print(f">> Placements complete: {placed_count} placed, {not_placed_count} not placed")
    
    # REQ-6 & REQ-16: Send notification emails after placements
    try:
        _send_placement_notifications(calendar, results)
    except Exception as e:
        print(f"Error sending placement notifications: {e}")
    
    return {
        "calendar": str(calendar),
        "total_candidatures": len(sorted_candidatures),
        "placed": placed_count,
        "not_placed": not_placed_count,
        "results": results
    }


def _send_placement_notifications(calendar, results):
    """
    REQ-6: Notify students about placement results
    REQ-16: Notify companies about students placed in their proposals
    """
    # Group results by company for REQ-16
    company_placements = defaultdict(list)
    student_emails = []
    
    for result in results:
        if result['status'] == 'placed':
            proposal = Proposal.objects.select_related('company').get(id_proposal=result['proposal_id'])
            student = Student.objects.select_related('user').get(student_number=result['student_number'])
            
            # Prepare student notification (REQ-6)
            student_emails.append({
                'email': student.user.email,
                'name': student.student_name,
                'proposal_title': result['proposal_title'],
                'company': proposal.company.company_name if proposal.company else 'ISEC',
                'placed': True
            })
            
            # Group by company for REQ-16
            if proposal.company:
                company_placements[proposal.company.id_company].append({
                    'student_name': student.student_name,
                    'student_number': student.student_number,
                    'student_email': student.user.email,
                    'student_contact': student.contact or 'N/A',
                    'proposal_title': result['proposal_title'],
                    'average': result['average']
                })
        else:
            # Student not placed (REQ-6)
            student = Student.objects.select_related('user').get(student_number=result['student_number'])
            student_emails.append({
                'email': student.user.email,
                'name': student.student_name,
                'placed': False
            })
    
    # Send emails to students (REQ-6)
    for student_info in student_emails:
        if student_info['placed']:
            subject = "Resultado da Colocação de Estágio/Projeto - ISEC"
            message = f"""
Caro(a) {student_info['name']},

Temos o prazer de informar que foi colocado(a) na seguinte proposta:

Proposta: {student_info['proposal_title']}
Entidade: {student_info['company']}

Próximos passos:
1. Será contactado(a) pela entidade acolhedora
2. O protocolo será gerado automaticamente
3. Aguarde instruções para assinatura do protocolo

Pode consultar os detalhes da sua colocação na plataforma: {settings.FRONTEND_URL}

Parabéns pela sua colocação!

Cumprimentos,
Serviços Académicos ISEC
            """.strip()
        else:
            subject = "Resultado da Colocação de Estágio/Projeto - ISEC"
            message = f"""
Caro(a) {student_info['name']},

Infelizmente, não foi possível realizar a sua colocação automática nas propostas selecionadas, pois não havia vagas disponíveis.

A sua candidatura foi movida para revisão. Os Serviços Académicos irão contactá-lo(a) em breve para discutir alternativas.

Por favor, aguarde contacto ou aceda à plataforma para mais informações: {settings.FRONTEND_URL}

Cumprimentos,
Serviços Académicos ISEC
            """.strip()
        
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[student_info['email']],
            fail_silently=True
        )
    
    # Send emails to companies (REQ-16)
    for company_id, placements in company_placements.items():
        try:
            company = Company.objects.get(id_company=company_id)
            representatives = Representative.objects.filter(
                company=company,
                user__is_active=True
            ).select_related('user')
            
            if not representatives.exists():
                continue
            
            recipient_emails = [rep.user.email for rep in representatives]
            
            # Build list of placed students
            students_list = "\n".join([
                f"  - {p['student_name']} (Nº {p['student_number']}, Média: {p['average']:.2f})\n"
                f"    Proposta: {p['proposal_title']}\n"
                f"    Contacto: {p['student_email']}, {p['student_contact']}"
                for p in placements
            ])
            
            subject = f"Colocações de Estudantes - {company.company_name}"
            message = f"""
Caro(a) Representante da {company.company_name},

Foram colocados {len(placements)} estudante(s) nas vossas propostas de estágio/projeto para o calendário {calendar}:

{students_list}

Próximos passos:
1. Os protocolos serão gerados automaticamente
2. Receberá notificação para assinatura dos protocolos
3. Poderá contactar os estudantes através dos dados acima

Pode consultar mais detalhes na plataforma: {settings.FRONTEND_URL}

Obrigado pela vossa colaboração!

Cumprimentos,
Serviços Académicos ISEC
            """.strip()
            
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=recipient_emails,
                fail_silently=True
            )
            
        except Company.DoesNotExist:
            continue