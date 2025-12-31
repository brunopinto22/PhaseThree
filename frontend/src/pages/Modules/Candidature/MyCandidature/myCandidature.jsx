import '../View/view.css';
import './myCandidature.css';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useContext } from 'react';
import { PrimaryButton, Alert, ProposalCard, StateTracker } from '../../../../components';
import { getStudentCandidature } from '../../../../services';
import { UserContext } from '../../../../contexts';

function MyCandidature() {

	const navigate = useNavigate();
	const { userInfo } = useContext(UserContext);
	const token = userInfo?.token;

	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [status, setStatus] = useState(null);
	const [errorMessage, setErrorMessage] = useState("");

	const [seeP, setSeeP] = useState(true);
	const [showHelp, setShowHelp] = useState(false);
	const [showHistory, setShowHistory] = useState(false);

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			const result = await getStudentCandidature(token, setStatus, setErrorMessage);
			if (result) {
				setData(result);
			}
			setLoading(false);
		};
		fetchData();
	}, [token]);

	// Map candidature state to StateTracker number and descriptions
	const stateInfo = {
		'submitted': {
			number: 1,
			label: 'Candidatura Submetida',
			description: 'A sua candidatura foi submetida com sucesso e está a aguardar o período de colocações.',
			nextStep: 'Aguarde a data de colocações para saber em que proposta foi colocado.',
			icon: 'bi-clock-history',
			color: '#6c757d'
		},
		'revision': {
			number: 1,
			label: 'Em Revisão',
			description: 'A sua candidatura está a ser revista pela coordenação do curso.',
			nextStep: 'Aguarde a revisão. Pode ser contactado para esclarecimentos adicionais.',
			icon: 'bi-search',
			color: '#ffc107'
		},
		'placed': {
			number: 2,
			label: 'Colocado',
			description: 'Parabéns! Foi colocado numa proposta. O protocolo será gerado em breve.',
			nextStep: 'Aguarde a geração do protocolo para iniciar o processo de assinaturas.',
			icon: 'bi-check-circle',
			color: '#28a745'
		},
		'protocol_generated': {
			number: 3,
			label: 'Protocolo Gerado',
			description: 'O protocolo de estágio foi gerado e aguarda assinatura do ISEC.',
			nextStep: 'Aguarde que o ISEC assine o protocolo.',
			icon: 'bi-file-earmark-text',
			color: '#17a2b8'
		},
		'presidency_signature': {
			number: 4,
			label: 'Assinatura ISEC',
			description: 'O protocolo foi assinado pelo ISEC e aguarda assinatura da empresa.',
			nextStep: 'Aguarde que a empresa assine o protocolo.',
			icon: 'bi-building',
			color: '#17a2b8'
		},
		'company_signature': {
			number: 5,
			label: 'Assinatura Empresa',
			description: 'A empresa assinou o protocolo. Agora é a sua vez!',
			nextStep: 'Deve assinar o protocolo para finalizar o processo.',
			icon: 'bi-pen',
			color: '#fd7e14'
		},
		'student_signature': {
			number: 6,
			label: 'Assinatura Aluno',
			description: 'Todas as partes assinaram o protocolo. O processo está quase concluído.',
			nextStep: 'Aguarde a confirmação final para poder iniciar o estágio.',
			icon: 'bi-clipboard-check',
			color: '#20c997'
		},
		'finished': {
			number: 7,
			label: 'Pode Iniciar Estágio',
			description: 'O processo está concluído! Pode iniciar o seu estágio/projeto.',
			nextStep: 'Contacte o seu orientador para definir os próximos passos.',
			icon: 'bi-rocket-takeoff',
			color: '#28a745'
		}
	};

	// Proposal state descriptions
	const proposalStateInfo = {
		'pending': {
			label: 'Pendente',
			description: 'Aguarda o processo de colocação',
			color: '#6c757d'
		},
		'accepted': {
			label: 'Aceite',
			description: 'Foi colocado nesta proposta',
			color: '#28a745'
		},
		'rejected': {
			label: 'Não Colocado',
			description: 'Não foi colocado nesta proposta',
			color: '#dc3545'
		}
	};

	if (loading) {
		return (
			<div id='candidature' className='d-flex flex-column'>
				<Alert text='A carregar...' type='info' />
			</div>
		);
	}

	if (errorMessage) {
		return (
			<div id='candidature' className='d-flex flex-column'>
				<Alert text={errorMessage} type='danger' />
			</div>
		);
	}

	// No candidature yet - show prompt to submit
	if (!data?.candidature) {
		return (
			<div id='candidature' className='d-flex flex-column'>
				<h3>Minha Candidatura</h3>
				
				{data?.calendar ? (
					<>
						<Alert text='Ainda não submeteu uma candidatura' type='warning' />
						
						<div className='info-box d-flex flex-column gap-2 my-3'>
							<p><strong>Calendário:</strong> {data.calendar.title}</p>
							<p><strong>Propostas a selecionar:</strong> {data.calendar.min_proposals} a {data.calendar.max_proposals}</p>
							<p><strong>Período de candidaturas:</strong> {data.calendar.candidatures_start} a {data.calendar.candidatures_end}</p>
						</div>

						{data.can_submit ? (
							<div className="col-md-4">
								<PrimaryButton 
									content={<h6>Submeter Candidatura</h6>} 
									action={() => navigate("/candidature/edit")} 
								/>
							</div>
						) : (
							<Alert text='Fora do período de candidaturas' type='info' />
						)}
					</>
				) : (
					<Alert text='Não tem um calendário atribuído. Contacte a coordenação do curso.' type='danger' />
				)}
			</div>
		);
	}

	const { candidature, calendar } = data;
	const { proposals, state, can_edit, history } = candidature;
	const currentStateInfo = stateInfo[state] || stateInfo['submitted'];
	
	// Find accepted proposal if any
	const acceptedProposal = proposals.find(p => p.state === 'accepted');

	// Count proposal states
	const pendingCount = proposals.filter(p => p.state === 'pending').length;
	const acceptedCount = proposals.filter(p => p.state === 'accepted').length;
	const rejectedCount = proposals.filter(p => p.state === 'rejected').length;

	return (
		<div id='candidature' className='d-flex flex-column'>

			<div className="header d-flex flex-column mb-3">
				<div className="d-flex justify-content-between align-items-center">
					<h3 className='title m-0'>Minha Candidatura</h3>
					<button 
						className="btn btn-link text-decoration-none"
						onClick={() => setShowHelp(!showHelp)}
					>
						<i className="bi bi-question-circle"></i> Ajuda
					</button>
				</div>
				{acceptedProposal && (
					<h6 className='mt-2'>
						<i className="bi bi-check-circle-fill text-success me-2"></i>
						Colocado em: {acceptedProposal.title}{' '}
						<span className='text-link' onClick={() => navigate("/proposal/view?id=" + acceptedProposal.id)}>
							@{acceptedProposal.company.name}
						</span>
					</h6>
				)}
			</div>

			{/* Help section */}
			{showHelp && (
				<div className="help-section mb-4 p-3 border rounded bg-light">
					<h5><i className="bi bi-info-circle me-2"></i>Como funciona o processo?</h5>
					<ol className="mb-3">
						<li><strong>Submissão:</strong> Seleciona as propostas e submete a candidatura</li>
						<li><strong>Colocações:</strong> Na data de colocações, é atribuída uma proposta</li>
						<li><strong>Protocolo:</strong> É gerado um protocolo de estágio</li>
						<li><strong>Assinaturas:</strong> ISEC, Empresa e Aluno assinam o protocolo</li>
						<li><strong>Início:</strong> Após todas as assinaturas, pode iniciar o estágio</li>
					</ol>
					<h6>Estados das Propostas:</h6>
					<div className="d-flex gap-3 flex-wrap">
						{Object.entries(proposalStateInfo).map(([key, info]) => (
							<span key={key} className="badge" style={{ backgroundColor: info.color }}>
								{info.label}: {info.description}
							</span>
						))}
					</div>
				</div>
			)}

			{/* Current Status Card */}
			<div className="status-card mb-4 p-4 border rounded" style={{ borderLeft: `4px solid ${currentStateInfo.color}` }}>
				<div className="d-flex align-items-center mb-2">
					<i className={`bi ${currentStateInfo.icon} me-2`} style={{ fontSize: '1.5rem', color: currentStateInfo.color }}></i>
					<h4 className="m-0" style={{ color: currentStateInfo.color }}>{currentStateInfo.label}</h4>
				</div>
				<p className="mb-2">{currentStateInfo.description}</p>
				<p className="mb-0 text-muted">
					<i className="bi bi-arrow-right-circle me-1"></i>
					<strong>Próximo passo:</strong> {currentStateInfo.nextStep}
				</p>
			</div>

			{/* State Tracker */}
			<StateTracker currentState={currentStateInfo.number} />

			{/* Proposals Summary */}
			<div className="proposals-summary my-3 d-flex gap-3 flex-wrap">
				<span className="badge bg-secondary">
					<i className="bi bi-clock me-1"></i>
					Pendentes: {pendingCount}
				</span>
				{acceptedCount > 0 && (
					<span className="badge bg-success">
						<i className="bi bi-check me-1"></i>
						Aceites: {acceptedCount}
					</span>
				)}
				{rejectedCount > 0 && (
					<span className="badge bg-danger">
						<i className="bi bi-x me-1"></i>
						Não Colocados: {rejectedCount}
					</span>
				)}
			</div>

			{/* Proposals List */}
			<div className='proposals d-flex flex-column gap-3'>
				<div className="d-flex flex-row align-content-center">
					<h4 className='d-flex flex-row align-items-center gap-2 noselect' style={{ cursor: "pointer" }} onClick={() => setSeeP(!seeP)}>
						<i className={`toggle-collapse bi bi-chevron-down`} style={{ transform: `rotateZ(${seeP ? "0" : "-90deg"})` }}></i>
						<span>Propostas Selecionadas ({proposals.length})</span>
					</h4>
				</div>
				<div className={`collapsible ${seeP ? "" : "collapse"}`}>
					{proposals.length === 0 ? (
						<Alert text='Nenhuma proposta selecionada' type='warning' />
					) : (
						<div className="d-flex flex-wrap gap-3">
							{proposals.map(p => (
								<ProposalCard 
									key={p.id}
									id={p.id}
									name={p.title}
									idCompany={p.company.id}
									company={p.company.name}
									slots={p.slots}
									slotsTaken={p.taken}
									state={p.state}
									canFav={false}
									showStatusBadge={true}
								/>
							))}
						</div>
					)}
				</div>
			</div>

			{/* Info Section */}
			<div className="info-section my-3 p-3 bg-light rounded">
				<h5><i className="bi bi-calendar-event me-2"></i>Informações</h5>
				<div className="row">
					<div className="col-md-6">
						<p className="mb-1"><strong>Calendário:</strong> {calendar.title}</p>
						<p className="mb-1"><strong>Data de submissão:</strong> {candidature.submission_date}</p>
					</div>
					<div className="col-md-6">
						<p className="mb-1"><strong>Limites:</strong> {calendar.min_proposals} a {calendar.max_proposals} propostas</p>
						<p className="mb-1"><strong>Propostas selecionadas:</strong> {proposals.length}</p>
					</div>
				</div>
			</div>

			{/* History Timeline (REQ-3) */}
			{history && history.length > 0 && (
				<div className="history-section my-3">
					<h4 
						className='d-flex flex-row align-items-center gap-2 noselect' 
						style={{ cursor: "pointer" }} 
						onClick={() => setShowHistory(!showHistory)}
					>
						<i className={`toggle-collapse bi bi-chevron-down`} style={{ transform: `rotateZ(${showHistory ? "0" : "-90deg"})` }}></i>
						<span><i className="bi bi-clock-history me-2"></i>Histórico ({history.length})</span>
					</h4>
					<div className={`collapsible ${showHistory ? "" : "collapse"}`}>
						<div className="timeline mt-3">
							{history.map((item, index) => (
								<div key={index} className="timeline-item">
									<div className="timeline-marker">
										<i className={`bi ${index === 0 ? 'bi-circle-fill' : 'bi-circle'}`}></i>
									</div>
									<div className="timeline-content">
										<div className="timeline-header">
											<span className="timeline-date">{item.changed_at}</span>
											<span className="timeline-author">por {item.changed_by}</span>
										</div>
										<div className="timeline-body">
											{item.previous_state ? (
												<span>
													<span className="state-badge old">{stateInfo[item.previous_state]?.label || item.previous_state}</span>
													<i className="bi bi-arrow-right mx-2"></i>
													<span className="state-badge new">{stateInfo[item.new_state]?.label || item.new_state}</span>
												</span>
											) : (
												<span className="state-badge new">{stateInfo[item.new_state]?.label || item.new_state}</span>
											)}
										</div>
										{item.notes && (
											<div className="timeline-notes text-muted small">
												<i className="bi bi-chat-left-text me-1"></i>{item.notes}
											</div>
										)}
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			)}

			{/* Actions */}
			{can_edit && (
				<div className="col-md-4 mt-3">
					<PrimaryButton content={<h6>Editar Candidatura</h6>} action={() => navigate("/candidature/edit?id=" + candidature.id)} />
				</div>
			)}

		</div>
	);

}

export default MyCandidature;
