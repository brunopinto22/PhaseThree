from django.db import transaction
from api.models import Calendar, Proposal, Teacher


def handle_orientation(calendar_id):
    """
    REQ-14: Automatic ISEC advisor assignment algorithm.
    
    Algorithm:
    1. Get all proposals for the calendar that need an ISEC advisor
    2. Get available teachers from the course's scientific area
    3. Load-balance by assigning to teachers with fewest current assignments
    4. Save isec_advisor to each proposal
    
    Returns a dict with assignment results.
    """
    try:
        calendar = Calendar.objects.get(id_calendar=calendar_id)
    except Calendar.DoesNotExist:
        print(f">> Calendar with id {calendar_id} not found.")
        return {"error": f"Calendar with id {calendar_id} not found.", "assigned": 0}
    
    print(f">> Starting orientation assignment for {calendar}")
    
    # Get proposals that need an ISEC advisor (company proposals without advisor)
    proposals = Proposal.objects.filter(
        calendar=calendar,
        company__isnull=False,  # Only company proposals need ISEC advisor
        isec_advisor__isnull=True
    )
    
    if not proposals.exists():
        print(">> No proposals need ISEC advisor assignment.")
        return {"message": "No proposals need assignment.", "assigned": 0}
    
    # Get active teachers from the course's scientific area
    teachers = Teacher.objects.filter(
        scientific_area=calendar.course.scientific_area,
        active=True
    )
    
    if not teachers.exists():
        print(f">> No teachers found in scientific area: {calendar.course.scientific_area}")
        return {"error": "No available teachers in the course's scientific area.", "assigned": 0}
    
    assigned_count = 0
    results = []
    
    with transaction.atomic():
        for proposal in proposals:
            # Get teacher with fewest current assignments for this calendar
            # This provides load balancing
            teacher_loads = []
            for teacher in teachers:
                current_load = Proposal.objects.filter(
                    calendar=calendar,
                    isec_advisor=teacher
                ).count()
                teacher_loads.append((teacher, current_load))
            
            # Sort by load (ascending) to get teacher with fewest assignments
            teacher_loads.sort(key=lambda x: x[1])
            selected_teacher = teacher_loads[0][0]
            
            # Assign the teacher
            proposal.isec_advisor = selected_teacher
            proposal.save()
            
            assigned_count += 1
            results.append({
                "proposal_id": proposal.id_proposal,
                "proposal_title": proposal.proposal_title,
                "company": proposal.company.company_name,
                "assigned_teacher": selected_teacher.teacher_name,
                "teacher_email": selected_teacher.user.email
            })
            
            print(f"   Assigned {selected_teacher.teacher_name} to '{proposal.proposal_title}'")
    
    print(f">> Orientation assignment complete: {assigned_count} proposals assigned")
    
    return {
        "calendar": str(calendar),
        "total_proposals": proposals.count(),
        "assigned": assigned_count,
        "results": results
    }
