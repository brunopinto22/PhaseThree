from django.utils import timezone
from django.db.models import Count, Q
from api.models import *

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


def handle_placements(calendar_id):
    """
    FUNÇÃO LEGADA - Mantida para retrocompatibilidade.
    Agora apenas chama a colocação automática.
    """
    print(">> AVISO: Usando novo sistema de colocação automática")
    handle_automatic_placements(calendar_id)
