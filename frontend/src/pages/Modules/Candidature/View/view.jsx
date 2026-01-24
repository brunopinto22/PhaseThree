import './view.css';
import default_pfp from './../../../../assets/imgs/default_pfp.jpg';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect, useContext } from 'react';
import { PrimaryButton, OptionButton, State, Alert, ProposalCard, StateTracker } from '../../../../components';
import { getCandidature, updateCandidatureState, updateCandidatureProposalState } from '../../../../services';
import { UserContext } from '../../../../contexts';

function View() {

	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const id = searchParams.get('id');
	const { userInfo } = useContext(UserContext);

	const [candidature, setCandidature] = useState(null);
	const [loading, setLoading] = useState(true);
	const [status, setStatus] = useState(null);
	const [errorMessage, setErrorMessage] = useState("");
	const [seeP, setSeeP] = useState(false);

	// State mapping for display
	const stateMap = {
		'submitted': 0,
		'revision': 0,
		'placed': 1,
		'protocol_generated': 2,
		'presidency_signature': 3,
		'company_signature': 4,
		'student_signature': 5,
		'finished': 6,
	};

	const stateLabels = {
		'submitted': 'Submetido',
		'revision': 'Revisão',
		'placed': 'Colocado',
		'protocol_generated': 'Protocolo Gerado',
		'presidency_signature': 'Assinatura ISEC',
		'company_signature': 'Assinatura Empresa',
		'student_signature': 'Assinatura Aluno',
		'finished': 'Finalizado',
	};

	const isAdmin = userInfo?.userType === 'admin' || userInfo?.userType === 'teacher';

	useEffect(() => {
		const fetchCandidature = async () => {
			if (!userInfo?.token || !id) return;
			
			setLoading(true);
			const data = await getCandidature(userInfo.token, id, setStatus, setErrorMessage);
			if (data) {
				setCandidature(data);
			}
			setLoading(false);
		};

		fetchCandidature();
	}, [id, userInfo]);

	const handleStateChange = async (newState) => {
		if (!userInfo?.token) return;
		
		const success = await updateCandidatureState(userInfo.token, id, newState, setStatus, setErrorMessage);
		if (success) {
			// Refresh data
			const data = await getCandidature(userInfo.token, id, setStatus, setErrorMessage);
			if (data) {
				setCandidature(data);
			}
		}
	};

	const handleProposalStateChange = async (proposalId, newState) => {
		if (!userInfo?.token) return;
		
		const success = await updateCandidatureProposalState(userInfo.token, id, proposalId, newState, setStatus, setErrorMessage);
		if (success) {
			// Refresh data
			const data = await getCandidature(userInfo.token, id, setStatus, setErrorMessage);
			if (data) {
				setCandidature(data);
			}
		}
	};

	if (loading) {
		return <div className='d-flex flex-column'><Alert text='A carregar candidatura...' /></div>;
	}

	if (!candidature) {
		return <div className='d-flex flex-column'><Alert text='Candidatura não encontrada' /></div>;
	}

	const acceptedProposal = candidature.proposals.find(p => p.state === 'accepted');
	const student = candidature.student;
	const fullName = student.name;
	const parts = fullName.trim().split(" ");
	const shortName = parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1]}` : fullName;

	return(
		<div id='candidature' className='d-flex flex-column'>

			<div className="header d-flex flex-column">
				<h3 className='title'>Estado da Candidatura</h3>
				{acceptedProposal && <h6>{acceptedProposal.title} <span className='text-link' onClick={() => navigate("/company/view?id=" + acceptedProposal.company.id)}>@{acceptedProposal.company.name}</span></h6>}
				<h6 className='sub-title text-link' onClick={() => navigate("/student/view?id=" + student.number)}>{shortName} nº{student.number}</h6>
			</div>

			{isAdmin && (
				<div className="d-flex flex-column gap-2 my-3">
					<label htmlFor="state-select"><strong>Alterar Estado da Candidatura:</strong></label>
					<select 
						id="state-select"
						className="form-select" 
						value={candidature.state}
						onChange={(e) => handleStateChange(e.target.value)}
						style={{maxWidth: '400px'}}
					>
						{Object.entries(stateLabels).map(([value, label]) => (
							<option key={value} value={value}>{label}</option>
						))}
					</select>
				</div>
			)}

			<StateTracker currentState={stateMap[candidature.state] || 0} />

			<div className='proposals d-flex flex-column gap-4'>
				<div className="d-flex flex-row align-content-center">
					<h4 className='d-flex flex-row align-items-center gap-2 noselect' style={{cursor: "pointer"}} onClick={() => setSeeP(!seeP)}>
						<i className={`toggle-collapse bi bi-chevron-down`} style={{ transform: `rotateZ(${seeP ? "0" : "-90deg"})` }}></i>
						<span>Propostas</span>
					</h4>
				</div>
				<div className={`collapsible ${seeP ? "" : "collapse"}`}>
					<div className="d-flex flex-wrap gap-3">
						{candidature.proposals.map(proposal => (
							<div key={proposal.id} className="proposal-card-wrapper">
								<ProposalCard 
									id={proposal.id}
									title={proposal.title}
									company={proposal.company.name}
									state={proposal.state}
								/>
								{isAdmin && (
									<div className="d-flex gap-2 mt-2">
										<button 
											className="btn btn-sm btn-success"
											onClick={() => handleProposalStateChange(proposal.id, 'accepted')}
											disabled={proposal.state === 'accepted'}
										>
											Aceitar
										</button>
										<button 
											className="btn btn-sm btn-danger"
											onClick={() => handleProposalStateChange(proposal.id, 'rejected')}
											disabled={proposal.state === 'rejected'}
										>
											Rejeitar
										</button>
									</div>
								)}
							</div>
						))}
					</div>
				</div>
			</div>

		</div>
	);

}

export default View;