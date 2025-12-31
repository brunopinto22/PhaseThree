import './edit.css';
import { useState, useEffect, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PrimaryButton, SecundaryButton, Alert, OptionButton, CheckBox } from '../../../../components';
import { getCandidature, updateCandidature, getStudentCandidature, submitCandidature } from '../../../../services';
import { listProposals } from '../../../../services';
import { UserContext } from '../../../../contexts';

const Edit = () => {

	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const { userInfo } = useContext(UserContext);
	const token = userInfo?.token;
	const type = userInfo?.role;

	const id = searchParams.get("id");
	const preSelectedProposal = searchParams.get("proposal"); // Pre-select from proposal view
	const isNew = !id;
	
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [status, setStatus] = useState(null);
	const [errorMessage, setErrorMessage] = useState("");
	const [successMessage, setSuccessMessage] = useState("");

	const [candidature, setCandidature] = useState(null);
	const [calendar, setCalendar] = useState(null);
	const [availableProposals, setAvailableProposals] = useState([]);
	const [selectedProposals, setSelectedProposals] = useState([]);

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);

			if (type === 'student') {
				// For students: get their candidature info and available proposals
				const studentData = await getStudentCandidature(token, setStatus, setErrorMessage);
				if (studentData) {
					setCalendar(studentData.calendar);
					if (studentData.candidature) {
						setCandidature(studentData.candidature);
						const existingProposals = studentData.candidature.proposals.map(p => p.id);
						// Add pre-selected proposal if not already in list
						if (preSelectedProposal && !existingProposals.includes(Number(preSelectedProposal))) {
							setSelectedProposals([...existingProposals, Number(preSelectedProposal)]);
						} else {
							setSelectedProposals(existingProposals);
						}
					} else if (preSelectedProposal) {
						// No existing candidature, pre-select the proposal
						setSelectedProposals([Number(preSelectedProposal)]);
					}
				}

				// Get available proposals for student's calendar
				const proposals = await listProposals(token, setStatus, setErrorMessage);
				if (proposals) {
					setAvailableProposals(proposals);
				}
			} else if (id) {
				// For admin/teachers editing existing candidature
				const data = await getCandidature(token, id, setStatus, setErrorMessage);
				if (data) {
					setCandidature(data);
					setCalendar(data.calendar);
					setSelectedProposals(data.proposals.map(p => p.id));
				}
			}

			setLoading(false);
		};
		fetchData();
	}, [token, id, type, preSelectedProposal]);

	const toggleProposal = (proposalId) => {
		if (selectedProposals.includes(proposalId)) {
			setSelectedProposals(selectedProposals.filter(id => id !== proposalId));
		} else {
			setSelectedProposals([...selectedProposals, proposalId]);
		}
		setErrorMessage("");
		setSuccessMessage("");
	};

	const submit = async () => {
		if (!calendar) return;

		// Validate limits (REQ-1)
		const count = selectedProposals.length;
		if (count < calendar.min_proposals) {
			setErrorMessage(`Deve selecionar pelo menos ${calendar.min_proposals} proposta(s). Selecionou ${count}.`);
			return;
		}
		if (count > calendar.max_proposals) {
			setErrorMessage(`Não pode selecionar mais de ${calendar.max_proposals} proposta(s). Selecionou ${count}.`);
			return;
		}

		setSubmitting(true);
		setErrorMessage("");

		let success = false;
		if (isNew || !candidature) {
			// Submit new candidature
			const result = await submitCandidature(token, selectedProposals, setStatus, setErrorMessage);
			success = !!result;
			if (success) {
				setSuccessMessage("Candidatura submetida com sucesso!");
				setTimeout(() => navigate("/candidature/view?id=" + result.candidature_id), 1500);
			}
		} else {
			// Update existing candidature
			const candidatureId = candidature.id || id;
			success = await updateCandidature(token, candidatureId, selectedProposals, setStatus, setErrorMessage);
			if (success) {
				setSuccessMessage("Candidatura atualizada com sucesso!");
				setTimeout(() => navigate("/candidature/view?id=" + candidatureId), 1500);
			}
		}

		setSubmitting(false);
	};
	
	const cancel = () => {
		if (window.history.length > 2)
			navigate(-1);
		else
			navigate('/');
	};

	const Row = ({ id, proposal_number, title, company, slots, taken, favourite }) => {
		const isSelected = selectedProposals.includes(id);
		const slotsLeft = slots - taken;
		
		const view = () => {
			navigate("/proposal/view?id=" + id);
		};

		return (
			<tr className={`table-row ${isSelected ? 'selected' : ''}`}>
				<th>
					<CheckBox 
						checked={isSelected} 
						onChange={() => toggleProposal(id)}
						disabled={!isSelected && slotsLeft <= 0}
					/>
				</th>
				<th><p>#{proposal_number}</p></th>
				<th><p>{title}</p></th>
				<th><p>{company?.name || 'ISEC'}</p></th>
				<th><p>{slotsLeft}/{slots}</p></th>
				<th>
					<div className='d-flex gap-2'>
						<OptionButton type='view' action={view} />
					</div>
				</th>
			</tr>
		);
	};

	if (loading) {
		return (
			<div id='candidature' className='d-flex flex-column'>
				<Alert text='A carregar...' type='info' />
			</div>
		);
	}

	if (!calendar) {
		return (
			<div id='candidature' className='d-flex flex-column'>
				<Alert text={errorMessage || "Não tem um calendário atribuído"} type='danger' />
			</div>
		);
	}

	const canSubmit = type === 'student' && calendar && !candidature?.can_edit === false;

	return (
		<div id='candidature' className='d-flex flex-column'>

			<section className='row p-0'>
				<h4>{isNew || !candidature ? 'Submeter Candidatura' : 'Editar Candidatura'}</h4>
				
				<div className='info-box d-flex flex-column gap-2 mb-3'>
					<p><strong>Calendário:</strong> {calendar.title}</p>
					<p>
						<strong>Propostas a selecionar:</strong>{' '}
						<span className={selectedProposals.length < calendar.min_proposals || selectedProposals.length > calendar.max_proposals ? 'text-danger' : 'text-success'}>
							{selectedProposals.length}
						</span>
						{' '}de {calendar.min_proposals} a {calendar.max_proposals}
					</p>
					{calendar.candidatures_start && calendar.candidatures_end && (
						<p><strong>Período:</strong> {calendar.candidatures_start} a {calendar.candidatures_end}</p>
					)}
				</div>

				{successMessage && <Alert text={successMessage} type='success' />}
				{errorMessage && <Alert text={errorMessage} type='danger' />}
			</section>

			<section className='p-0'>
				<h4>Propostas Disponíveis</h4>

				{availableProposals.length === 0 && (
					<Alert text='Não existem propostas disponíveis de momento' type='warning' />
				)}

				{availableProposals.length > 0 && (
					<table>
						<thead>
						<tr className='header'>
								<th className='fit-column'></th>
								<th className='fit-column'><p>#</p></th>
							<th><p>Proposta</p></th>
							<th><p>Empresa/Docente</p></th>
								<th className='fit-column'><p>Vagas</p></th>
								<th className='fit-column'></th>
						</tr>
						</thead>
						<tbody>
							{availableProposals.map(proposal => (
							<Row key={proposal.id} {...proposal} />
						))}
						</tbody>
					</table>
				)}
				
			</section>

			<section className="buttons d-flex flex-row gap-3 col-sm-12 col-md-5 p-0">
				<PrimaryButton 
					action={submit} 
					content={<h6>{submitting ? 'A submeter...' : (isNew || !candidature ? 'Submeter' : 'Guardar')}</h6>}
					disabled={submitting || selectedProposals.length < calendar.min_proposals || selectedProposals.length > calendar.max_proposals}
				/>
				<SecundaryButton action={cancel} content={<h6>Cancelar</h6>} />
			</section>
		</div>
	);

}

export default Edit;
