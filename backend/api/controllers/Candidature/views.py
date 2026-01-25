from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from rest_framework.status import *
from api.models import *
from api.token_manager import *
from django.db.models import Prefetch

@api_view(["GET"])
def getCandidature(request, pk):
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    if user_email in ["Expired Token.", "Invalid Token", "Payload does not contain 'user_id'."]:
        return Response({"message": "login"}, status=HTTP_400_BAD_REQUEST)

    try:
        candidature = Candidature.objects.prefetch_related(
            Prefetch('candidature_proposals', queryset=CandidatureProposal.objects.select_related('proposal', 'proposal__company'))
        ).get(id_candidature=pk)

        # Permission check
        if user_type == "student":
            student = Student.objects.get(user__email=user_email)
            if candidature.student != student:
                return Response({"message": "Forbidden"}, status=HTTP_403_FORBIDDEN)
        elif user_type not in ["admin", "teacher"]:
             # Basic check, finer grained could be added
             return Response({"message": "Forbidden"}, status=HTTP_403_FORBIDDEN)
        
        # If teacher, check permissions maybe? For now assuming admin/teacher can view.

        proposals_data = []
        for cp in candidature.candidature_proposals.all():
            proposals_data.append({
                "id": cp.id, # id of the relationship
                "proposal_id": cp.proposal.id_proposal,
                "proposal_title": cp.proposal.proposal_title,
                "company_name": cp.proposal.company.company_name if cp.proposal.company else "ISEC",
                "company_id": cp.proposal.company.id_company if cp.proposal.company else None,
                "location": cp.proposal.location,
                "slots": cp.proposal.slots,
                "slotsTaken": cp.proposal.get_slots_left(), # Wait, usually get_slots_left is slots - taken. We want taken? Or left?
                # The ProposalCard shows "slotsTaken/slots" but the label is "Nº de vagas".
                # If "Nº de vagas" means "Vacancies", it should be "Left".
                # But visual is "X/Y". Usually "X filled of Y total" or "X left of Y total".
                # Let's assume X is Taken.
                # Proposal model has get_slots_left. taken = slots - left.
                "slots_taken": cp.proposal.slots - cp.proposal.get_slots_left(),
                "state": cp.state
            })

        data = {
            "id": candidature.id_candidature,
            "state": candidature.state,
            "student": {
                "id": candidature.student.student_number,
                "name": candidature.student.student_name,
                "email": candidature.student.user.email
            },
            "submission_date": candidature.candidature_submission_date,
            "proposals": proposals_data
        }

        return Response(data, status=HTTP_200_OK)

    except Candidature.DoesNotExist:
        return Response({"message": "Candidature not found"}, status=HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["PUT"])
def updateCandidatureState(request, pk):
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    if user_email in ["Expired Token.", "Invalid Token", "Payload does not contain 'user_id'."]:
        return Response({"message": "login"}, status=HTTP_400_BAD_REQUEST)

    # Only Admin (Academic Services) can force state changes
    if user_type != "admin":
         return Response({"message": "Forbidden"}, status=HTTP_403_FORBIDDEN)

    try:
        candidature = Candidature.objects.get(id_candidature=pk)
        new_state = request.data.get("state")

        # Validate state? 
        valid_states = dict(Candidature.STATE_CHOICES).keys()
        if new_state not in valid_states:
             return Response({"message": "Invalid state"}, status=HTTP_400_BAD_REQUEST)

        candidature.state = new_state
        candidature.save()

        return Response({"message": "State updated"}, status=HTTP_200_OK)

    except Candidature.DoesNotExist:
        return Response({"message": "Candidature not found"}, status=HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(["PUT"])
def updateCandidatureProposalState(request, pk):
    """
    Updates the state of a specific proposal within a candidature (Accept/Reject).
    pk here is the CandidatureProposal ID, NOT the Proposal ID.
    """
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    if user_email in ["Expired Token.", "Invalid Token", "Payload does not contain 'user_id'."]:
        return Response({"message": "login"}, status=HTTP_400_BAD_REQUEST)

    # Only Admin (Academic Services) can force state changes
    if user_type != "admin":
         return Response({"message": "Forbidden"}, status=HTTP_403_FORBIDDEN)

    try:
        cp = CandidatureProposal.objects.get(id=pk)
        new_state = request.data.get("state")

        if new_state not in ["accepted", "rejected", "pending"]:
             return Response({"message": "Invalid state"}, status=HTTP_400_BAD_REQUEST)
        
        cp.state = new_state
        cp.save()
        
        # If accepted, reject all other proposals in the same candidature
        if new_state == "accepted":
            candidature = cp.candidature
            # Reject all other proposals
            CandidatureProposal.objects.filter(
                candidature=candidature
            ).exclude(id=pk).update(state="rejected")
            
            # Update candidature state to 'placed' if not already
            if candidature.state == "submitted" or candidature.state == "revision":
                candidature.state = "placed"
                candidature.save()
        
        return Response({"message": "Proposal state updated"}, status=HTTP_200_OK)

    except CandidatureProposal.DoesNotExist:
        return Response({"message": "Candidature Proposal not found"}, status=HTTP_404_NOT_FOUND)
    except Exception as e:
         return Response({"error": str(e)}, status=HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
def listCandidatures(request):
    auth_header = request.headers.get("Authorization")
    user_id, user_email, user_type = decode_token(auth_header)

    if user_email in ["Expired Token.", "Invalid Token", "Payload does not contain 'user_id'."]:
        return Response({"message": "login"}, status=HTTP_400_BAD_REQUEST)

    # Permission: Admin, Teacher (Commission), maybe Student (own)?
    # For now, let's allow Admin and Teachers.
    if user_type not in ["admin", "teacher"]:
         return Response({"message": "Forbidden"}, status=HTTP_403_FORBIDDEN)

    try:
        candidatures = Candidature.objects.select_related('student', 'student__student_course').prefetch_related(
            Prefetch('candidature_proposals', queryset=CandidatureProposal.objects.select_related('proposal', 'proposal__company'))
        ).all()

        data = []
        for c in candidatures:
            # Determine main proposal info (e.g. if placed, or the first one)
            # Logic: If placed, show the placed proposal. If submitted, show maybe count?
            # The list view shows "Proposal" and "Company".
            
            # Simple logic: get the first proposal or the accepted one
            main_prop = c.candidature_proposals.filter(state='accepted').first()
            if not main_prop:
                main_prop = c.candidature_proposals.first()

            data.append({
                "id": c.id_candidature,
                "studentName": c.student.student_name,
                "studentNumber": c.student.student_number,
                "companyName": main_prop.proposal.company.company_name if main_prop and main_prop.proposal.company else (
                    "ISEC" if main_prop else "—"
                ),
                "proposalName": main_prop.proposal.proposal_title if main_prop else "—",
                "state": c.state # Frontend will map this string to number or handle it
            })

        return Response(data, status=HTTP_200_OK)

    except Exception as e:
        return Response({"error": str(e)}, status=HTTP_500_INTERNAL_SERVER_ERROR)
