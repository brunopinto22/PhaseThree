import './view.css';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useContext } from 'react';
import { PrimaryButton, SecundaryButton, Alert, StateTracker } from '../../../../components';
import HistoryTimeline from '../../../../components/HistoryTimeline/historyTimeline';
import { UserContext } from '../../../../contexts';
import { getMyCandidature, getCandidatureHistory } from '../../../../services';

function View() {

	const navigate = useNavigate();
	const { userInfo } = useContext(UserContext);
	const [status, setStatus] = useState(null);
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(true);

	const [candidature, setCandidature] = useState(null);
	const [calendar, setCalendar] = useState(null);
	const [history, setHistory] = useState([]);

	const getStateLabel = (state) => {
		const labels = {
			'submitted': 'Submetida',
			'placed': 'Colocado',
			'accepted': 'Aceite pela Empresa',
			'rejected': 'Rejeitado',
			'revision': 'Em Revisão',
			'protocol_generated': 'Protocolo Gerado',
			'presidency_signature': 'Aguardando Assinatura ISEC',
			'company_signature': 'Aguardando Assinatura Empresa',
			'student_signature': 'Aguardando Sua Assinatura',
			'finished': 'Concluído'
		};
		return labels[state] || state;
	};

	const getStateDescription = (state) => {
		const descriptions = {
			'submitted': 'Sua candidatura foi submetida com sucesso e está aguardando a data de colocação automática.',
			'placed': 'Parabéns! Você foi colocado numa proposta de estágio com base na sua média e prioridades. Aguarde a análise da empresa.',
			'accepted': 'Excelente! A empresa aceitou sua candidatura. O processo de estágio prosseguirá.',
			'rejected': 'Infelizmente sua candidatura foi rejeitada. O sistema tentou recolocá-lo em outras propostas de sua lista.',
			'revision': 'Sua candidatura está sendo analisada pelos serviços académicos.',
			'protocol_generated': 'O protocolo de estágio foi gerado e está pronto para assinatura.',
			'presidency_signature': 'O protocolo aguarda assinatura da presidência do ISEC.',
			'company_signature': 'O protocolo aguarda assinatura da empresa.',
			'student_signature': 'O protocolo aguarda sua assinatura. Por favor, assine o documento.',
			'finished': 'Processo concluído! Seu estágio está oficialmente iniciado.'
		};
		return descriptions[state] || 'Estado desconhecido';
	};

	const getNextSteps = (state) => {
		const nextSteps = {
			'submitted': 'Aguarde a data de colocação automática.',
			'placed': 'Aguarde a empresa aceitar ou rejeitar sua candidatura.',
			'accepted': 'Aguarde a validação pelos serviços acadêmicos.',
			'rejected': 'Entre em contato com os serviços acadêmicos se necessário.',
			'revision': 'Aguarde a geração do protocolo de estágio.',
			'protocol_generated': 'Aguarde a assinatura da presidência.',
			'presidency_signature': 'Aguarde a empresa assinar o protocolo.',
			'company_signature': 'Assine o protocolo assim que possível.',
			'student_signature': 'Aguarde finalização do processo.',
			'finished': 'Processo completo. Bom estágio!'
		};
		return nextSteps[state] || '';
	};

	useEffect(() => {
		const fetchData = async () => {
			const data = await getMyCandidature(userInfo.token, setStatus, setError);
			
			if (data) {
				setCalendar(data.calendar);
				
				if (data.has_candidature) {
					setCandidature(data);
					
					// Buscar histórico da candidatura
					const historyData = await getCandidatureHistory(
						userInfo.token,
						data.id_candidature,
						setStatus,
						setError
					);
					
					if (historyData && historyData.history) {
						setHistory(historyData.history);
					}
				}
			}
			
			setLoading(false);
		};

		fetchData();
	}, [userInfo.token]);

	const handleSubmit = () => {
		navigate('/candidature/edit');
	};

	const handleEdit = () => {
		navigate('/candidature/edit');
	};

	const ProposalRow = ({ proposal, priority, isPlaced }) => {
		const stateMap = {
			'pending': { text: 'Pendente', class: 'warning' },
			'accepted': { text: 'Aceite', class: 'success' },
			'rejected': { text: 'Rejeitada', class: 'danger' },
			'placed': { text: 'Colocado', class: 'info' },
			'skipped': { text: 'Ignorada', class: 'secondary' }
		};
		
		const stateInfo = stateMap[proposal.state] || stateMap['pending'];
		const rowClass = isPlaced ? 'table-row placed-row' : 'table-row';

		return (
			<tr className={rowClass}>
				<td>
					<div className="priority-badge-small">{priority}ª</div>
				</td>
				<td>
					<p>
						{proposal.title}
						{isPlaced}
					</p>
				</td>
				<td><p>{proposal.company?.name || 'ISEC'}</p></td>
				<td>
					<span className={`badge badge-${stateInfo.class}`}>{stateInfo.text}</span>
				</td>
			</tr>
		);
	};

	if (loading) {
		return (
			<div id='candidature' className='d-flex flex-column'>
				<h3>A carregar...</h3>
			</div>
		);
	}

	const hasCandidature = candidature !== null;
	const canEdit = hasCandidature && candidature.state === 'submitted';

	return(
		<div id='candidature' className='d-flex flex-column'>

			<section className='row p-0'>
				<h3>Minha Candidatura</h3>
				
				{error && <Alert text={error} type='danger' />}

				{calendar && (
					<div className='calendar-info'>
						<h5>Informações do Calendário</h5>
						<p><strong>Limites:</strong> Entre {calendar.min} e {calendar.max} propostas</p>
						<p><strong>Prazo de Candidaturas:</strong> {calendar.candidatures_deadline}</p>
					</div>
				)}
			</section>

			{hasCandidature ? (
				<>
					<section className='state-progress p-0'>
						<h4>Progresso da Candidatura</h4>
						<StateTracker currentState={candidature.state} />
						
						<div className='current-state-info'>
							<h5>Estado Atual: {getStateLabel(candidature.state)}</h5>
							<p className='state-description'>{getStateDescription(candidature.state)}</p>
							<p className='next-steps'><strong>Próximos Passos:</strong> {getNextSteps(candidature.state)}</p>
						</div>
					</section>

					<section className='p-0'>
						<h4 className="mb-4">Propostas Selecionadas (por ordem de prioridade)</h4>
						
						{candidature.proposals.length === 0 ? (
							<Alert text='Nenhuma proposta selecionada' type='warning' />
						) : (
							<table>
								<thead>
									<tr className='header'>
										<th><p>Prioridade</p></th>
										<th><p>Título</p></th>
										<th><p>Empresa</p></th>
										<th><p>Estado</p></th>
									</tr>
								</thead>
								<tbody>
									{candidature.proposals
										.sort((a, b) => a.priority - b.priority)
										.map(proposal => (
											<ProposalRow 
												key={proposal.id} 
												proposal={proposal} 
												priority={proposal.priority}
												isPlaced={candidature.placed_proposal?.id === proposal.id}
											/>
										))}
								</tbody>
							</table>
						)}
					</section>

					<HistoryTimeline history={history} />

					<section className="buttons d-flex flex-row gap-3 col-sm-12 col-md-6 p-0">
						<SecundaryButton 
							action={handleSubmit}
							content={
								<div className='d-flex flex-column align-items-center'>
									<h6>Submeter Candidatura</h6>
									<small className='text-muted'>Só é possível ter uma candidatura ativa</small>
								</div>
							}
							disabled={true}
						/>
						<PrimaryButton 
							action={handleEdit}
							content={<h6>Editar Candidatura</h6>}
							disabled={!canEdit}
						/>
					</section>
				</>
			) : (
				<>
					<section className='no-candidature p-0'>
						<Alert text='Você ainda não submeteu uma candidatura' type='info' />
						<p>Clique no botão abaixo para selecionar suas propostas e submeter sua candidatura.</p>
					</section>

					<section className="buttons d-flex flex-row gap-3 col-sm-12 col-md-6 p-0">
						<PrimaryButton 
							action={handleSubmit}
							content={<h6>Submeter Candidatura</h6>}
						/>
						<SecundaryButton 
							action={handleEdit}
							content={<h6>Editar Candidatura</h6>}
							disabled={true}
						/>
					</section>
				</>
			)}

		</div>
	);

}

export default View;