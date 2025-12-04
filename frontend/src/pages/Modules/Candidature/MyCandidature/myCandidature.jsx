import '../View/view.css';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useContext } from 'react';
import { PrimaryButton, Alert, ProposalCard, StateTracker } from '../../../../components';
import { getStudentCandidature } from '../../../../services';
import { UserContext } from '../../../../contexts';

function MyCandidature() {

	const navigate = useNavigate();
	const { token } = useContext(UserContext);

	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [status, setStatus] = useState(null);
	const [errorMessage, setErrorMessage] = useState("");

	const [seeP, setSeeP] = useState(true);

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

	// Map candidature state to StateTracker number
	const stateMap = {
		'submitted': 1,
		'revision': 1,
		'placed': 2,
		'protocol_generated': 3,
		'presidency_signature': 4,
		'company_signature': 5,
		'student_signature': 6,
		'finished': 7,
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
	const { proposals, state, can_edit } = candidature;
	const stateNumber = stateMap[state] || 1;
	
	// Find accepted proposal if any
	const acceptedProposal = proposals.find(p => p.state === 'accepted');

	return (
		<div id='candidature' className='d-flex flex-column'>

			<div className="header d-flex flex-column">
				<h3 className='title'>Minha Candidatura</h3>
				{acceptedProposal && (
					<h6>
						Colocado em: {acceptedProposal.title}{' '}
						<span className='text-link' onClick={() => navigate("/proposal/view?id=" + acceptedProposal.id)}>
							@{acceptedProposal.company.name}
						</span>
					</h6>
				)}
			</div>

			<StateTracker currentState={stateNumber} />

			<div className='proposals d-flex flex-column gap-4'>
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
									title={p.title}
									company={p.company.name}
									slots={p.slots}
									taken={p.taken}
									state={p.state}
								/>
							))}
						</div>
					)}
				</div>
			</div>

			<div className="info-section my-3">
				<p><strong>Calendário:</strong> {calendar.title}</p>
				<p><strong>Limites:</strong> {calendar.min_proposals} a {calendar.max_proposals} propostas</p>
				<p><strong>Data de submissão:</strong> {candidature.submission_date}</p>
			</div>

			{can_edit && (
				<div className="col-md-4">
					<PrimaryButton content={<h6>Editar Candidatura</h6>} action={() => navigate("/candidature/edit?id=" + candidature.id)} />
				</div>
			)}

		</div>
	);

}

export default MyCandidature;

