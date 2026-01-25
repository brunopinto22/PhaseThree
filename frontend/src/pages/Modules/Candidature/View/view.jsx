import './view.css';
import { useSearchParams } from 'react-router-dom'; // navigate removed
import { useState, useEffect, useContext, useCallback } from 'react';
import { ProposalCard, StateTracker } from '../../../../components';
import { getCandidature, updateCandidatureState, updateCandidatureProposalState } from '../../../../services/candidatures';
import { UserContext } from '../../../../contexts/UserContext';

function View() {

	const [searchParams] = useSearchParams();
	const id = searchParams.get('id');
	const { user } = useContext(UserContext);

	const token = localStorage.getItem("access_token");
	const isAcademicServices = user?.type === 'admin';

	const [candidature, setCandidature] = useState(null);
	const [loading, setLoading] = useState(true);
	const [seeP, setSeeP] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");
	const [status, setStatus] = useState(0);

	const fetchData = useCallback(async () => {
		setLoading(true);
		const data = await getCandidature(token, id, setStatus, setErrorMessage);
		if (data) {
			setCandidature(data);
		}
		setLoading(false);
	}, [token, id]);

	useEffect(() => {
		if (id && token) {
			fetchData();
		}
	}, [id, token, fetchData]);

	const handleStateChange = async (newState) => {
		const success = await updateCandidatureState(token, id, newState, setStatus, setErrorMessage);
		if (success) {
			fetchData();
		}
	};

	const handleProposalStateChange = async (proposalRelId, newState) => {
		const success = await updateCandidatureProposalState(token, proposalRelId, newState, setStatus, setErrorMessage);
		if (success) {
			fetchData();
		}
	};

	if (loading) return <div className="p-4">Loading...</div>;

	if (status !== 200 && status !== 0 && errorMessage) {
		return <div className="p-4 alert alert-danger">{errorMessage}</div>;
	}

	if (!candidature) return <div className="p-4">Candidature not found</div>;

	const stateMap = {
		'submitted': 1,
		'revision': 2,
		'placed': 3,
		'protocol_generated': 4,
		'presidency_signature': 5,
		'company_signature': 6,
		'student_signature': 7,
		'finished': 8
	};

	const currentStateNum = stateMap[candidature.state] || 0;

	const availableStates = [
		{ value: 'submitted', label: 'Submitted' },
		{ value: 'revision', label: 'Revision' },
		{ value: 'placed', label: 'Placed' },
		{ value: 'protocol_generated', label: 'Protocol Generated' },
		{ value: 'presidency_signature', label: 'ISEC Signature' },
		{ value: 'company_signature', label: 'Company Signature' },
		{ value: 'student_signature', label: 'Student Signature' },
		{ value: 'finished', label: 'Finished' },
	];

	return (
		<div id='candidature' className='d-flex flex-column'>

			<div className="header d-flex flex-column">
				<h3 className='title'>Estado da Candidatura</h3>
				<h6 className='sub-title'>{candidature.student.name} nº{candidature.student.id}</h6>
				<p>Status: <strong>{candidature.state}</strong></p>

				{isAcademicServices && (
					<div className="admin-controls my-3 p-3 border rounded">
						<h5>Academic Services Controls</h5>
						{errorMessage && <div className="alert alert-danger p-2">{errorMessage}</div>}
						<div className="d-flex gap-2 align-items-center">
							<span>Change State:</span>
							<select
								className="form-select w-auto"
								value={candidature.state}
								onChange={(e) => handleStateChange(e.target.value)}
							>
								{availableStates.map(st => (
									<option key={st.value} value={st.value}>{st.label}</option>
								))}
							</select>
						</div>
					</div>
				)}
			</div>

			{/* Display currentStateNum + 1 so that the visual tracker shows the *next* step as current (red circle) and previous as done (checkmark) */}
			<StateTracker currentState={currentStateNum + 1} />

			<div className='proposals d-flex flex-column gap-4'>
				<div className="d-flex flex-row align-content-center">
					<h4 className='d-flex flex-row align-items-center gap-2 noselect' style={{ cursor: "default" }} onClick={() => setSeeP(!seeP)}>
						<i className={`toggle-collapse bi bi-chevron-down`} style={{ transform: `rotateZ(${seeP ? "0" : "-90deg"})` }}></i>
						<span>Propostas ({candidature.proposals.length})</span>
					</h4>
				</div>
				<div className={`collapsible ${seeP ? "" : "collapse"}`}>
					<div className="d-flex flex-wrap gap-3">
						{candidature.proposals.map(prop => (
							<div key={prop.id} className="proposal-item-wrapper d-flex flex-column gap-2">
								<ProposalCard
									id={prop.proposal_id} // For navigation
									name={prop.proposal_title}
									company={prop.company_name}
									idCompany={prop.company_id}
									location={prop.location}
									slots={prop.slots}
									slotsTaken={prop.slots_taken}
									state={prop.state}
									canFav={false}
								/>
								{isAcademicServices && (
									<div className="d-flex gap-1 justify-content-center">
										<button
											className="btn btn-sm btn-success"
											onClick={() => handleProposalStateChange(prop.id, 'accepted')}
											disabled={prop.state === 'accepted'}
										>
											Accept
										</button>
										<button
											className="btn btn-sm btn-danger"
											onClick={() => handleProposalStateChange(prop.id, 'rejected')}
											disabled={prop.state === 'rejected'}
										>
											Reject
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