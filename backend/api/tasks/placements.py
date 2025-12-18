from django.db import transaction
from api.models import (
    Calendar, Candidature, CandidatureProposal, CandidatureHistory,
    Student, Proposal
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
    
    return {
        "calendar": str(calendar),
        "total_candidatures": len(sorted_candidatures),
        "placed": placed_count,
        "not_placed": not_placed_count,
        "results": results
    }