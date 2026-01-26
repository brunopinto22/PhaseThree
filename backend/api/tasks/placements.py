from django.utils import timezone
from api.models import *

def handle_placements(calendar_id):
    """
    Consolida APENAS decisões manuais dos representatives.
    Vagas não preenchidas manualmente ficam vazias.
    """
    calendar = None
    try:
        calendar = Calendar.objects.get(id_calendar=calendar_id)
    except Calendar.DoesNotExist:
        print(f">> Calendar with id {calendar_id} not found.")
        return
    
    print(f">> Processando placements para {calendar.__str__()}")
    
    # 1. Buscar todas as propostas do calendário
    proposals = Proposal.objects.filter(calendar=calendar)
    
    # 2. Rejeitar todos os candidatos que ficaram 'pending'
    # (empresas não tomaram decisão = rejeição automática)
    for proposal in proposals:
        pending_count = CandidatureProposal.objects.filter(
            proposal=proposal,
            state='pending'
        ).update(state='rejected', state_changed_at=timezone.now())
        
        if pending_count > 0:
            print(f"   >> Proposta {proposal.id_proposal}: {pending_count} candidatos rejeitados automaticamente")
    
    # 3. Processar candidaturas: atualizar estados e adicionar students
    candidatures = Candidature.objects.filter(student__calendar=calendar)
    placed_count = 0
    rejected_count = 0
    
    for candidature in candidatures:
        # Buscar proposta aceite (decisão manual da empresa)
        accepted_proposal = CandidatureProposal.objects.filter(
            candidature=candidature,
            state='accepted'
        ).select_related('proposal').first()
        
        if accepted_proposal:
            # Aluno foi colocado
            candidature.change_state(
                new_state='placed',
                changed_by=None,
                notes=f'Colocado na proposta {accepted_proposal.proposal.proposal_title}'
            )
            
            # Adicionar aluno à proposta
            accepted_proposal.proposal.students.add(candidature.student)
            placed_count += 1
            print(f"   >> Aluno {candidature.student.student_number} colocado na proposta {accepted_proposal.proposal.id_proposal}")
        else:
            # Aluno não foi aceite em nenhuma proposta
            candidature.change_state(
                new_state='rejected',
                changed_by=None,
                notes='Não foi aceite em nenhuma proposta'
            )
            rejected_count += 1
    
    print(f">> Placements concluídos para {calendar.__str__()}")
    print(f"   >> Total: {placed_count} alunos colocados, {rejected_count} alunos não colocados")