import './view.css';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect, useContext } from 'react';
import { PrimaryButton, Alert, ProposalCard, StateTracker } from '../../../../components';
import { getCandidature } from '../../../../services';
import { UserContext } from '../../../../contexts';

function View() {

	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
	const { token, type } = useContext(UserContext);

	const [candidature, setCandidature] = useState(null);
	const [loading, setLoading] = useState(true);
	const [status, setStatus] = useState(null);
	const [errorMessage, setErrorMessage] = useState("");

	const [seeP, setSeeP] = useState(true);

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			const data = await getCandidature(token, id, setStatus, setErrorMessage);
			if (data) {
				setCandidature(data);
			}
			setLoading(false);
		};
		if (id) fetchData();
	}, [token, id]);

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

	if (errorMessage || !candidature) {
		return (
			<div id='candidature' className='d-flex flex-column'>
				<Alert text={errorMessage || "Candidatura não encontrada"} type='danger' />
			</div>
		);
	}

	const { student, proposals, state, calendar, can_edit } = candidature;
	const stateNumber = stateMap[state] || 1;
	
	// Find accepted proposal if any
	const acceptedProposal = proposals.find(p => p.state === 'accepted');

	const parts = student.name.trim().split(" ");
	const shortName = parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1]}` : student.name;

	return (
		<div id='candidature' className='d-flex flex-column'>

			<div className="header d-flex flex-column">
				<h3 className='title'>Estado da Candidatura</h3>
				{acceptedProposal && (
					<h6>
						{acceptedProposal.title}{' '}
						<span className='text-link' onClick={() => navigate("/proposal/view?id=" + acceptedProposal.id)}>
							@{acceptedProposal.company.name}
						</span>
					</h6>
				)}
				<h6 className='sub-title text-link' onClick={() => navigate("/student/view?id=" + student.number)}>
					{shortName} nº{student.number}
				</h6>
			</div>

			<StateTracker currentState={stateNumber} />

			<div className='proposals d-flex flex-column gap-4'>
				<div className="d-flex flex-row align-content-center">
					<h4 className='d-flex flex-row align-items-center gap-2 noselect' style={{ cursor: "pointer" }} onClick={() => setSeeP(!seeP)}>
						<i className={`toggle-collapse bi bi-chevron-down`} style={{ transform: `rotateZ(${seeP ? "0" : "-90deg"})` }}></i>
						<span>Propostas ({proposals.length})</span>
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

			<div className="info-section">
				<p><strong>Calendário:</strong> {calendar.title}</p>
				<p><strong>Limites:</strong> {calendar.min_proposals} a {calendar.max_proposals} propostas</p>
				<p><strong>Data de submissão:</strong> {candidature.submission_date}</p>
			</div>

			{can_edit && (type === 'admin' || type === 'teacher') && (
				<div className="col">
					<PrimaryButton content={<h6>Editar Candidatura</h6>} action={() => navigate("/candidature/edit?id=" + id)} />
				</div>
			)}

		</div>
	);

}

export default View;
