import './edit.css';
import { useState, useEffect, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PrimaryButton, SecundaryButton, Dropdown, Alert } from '../../../../components';
import { getCandidature, updateCandidatureState, updateCandidatureProposalState } from '../../../../services/candidatures';
import { UserContext } from '../../../../contexts/UserContext';


const Edit = () => {

	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const id = searchParams.get("id");
	const { user } = useContext(UserContext);
	const token = localStorage.getItem("access_token");

	const [state, setState] = useState(null); // Candidature State
	const [candidature, setCandidature] = useState(null);
	const [loading, setLoading] = useState(true);
	// eslint-disable-next-line
	const [status, setStatus] = useState(0);
	const [errorMessage, setErrorMessage] = useState("");

	const isAcademicServices = user?.type === 'admin' || localStorage.getItem("user_role") === 'admin';

	// Available states for Candidature
	const availableStates = [
		{ value: 'submitted', label: 'Submetido' },
		{ value: 'revision', label: 'Revisão' },
		{ value: 'placed', label: 'Colocado' },
		{ value: 'protocol_generated', label: 'Protocolo Gerado' },
		{ value: 'presidency_signature', label: 'Protocolo ISEC' }, // ISEC Signature
		{ value: 'company_signature', label: 'Protocolo Empresa' }, // Company Signature
		{ value: 'student_signature', label: 'Protocolo Aluno' }, // Student Signature
		{ value: 'finished', label: 'Terminado' }, // Finished
	];

	useEffect(() => {
		const fetchData = async () => {
			if (!id || !token) return;
			setLoading(true);
			const data = await getCandidature(token, id, setStatus, setErrorMessage);
			if (data) {
				setCandidature(data);
				setState(data.state);
			}
			setLoading(false);
		};
		fetchData();
	}, [id, token]);


	const submit = async () => {
		setErrorMessage("");
		// Update Candidature State
		if (state && state !== candidature.state) {
			const success = await updateCandidatureState(token, id, state, setStatus, setErrorMessage);
			if (!success) return;
		}

		// Return to view or show success
		navigate("/candidature/view?id=" + id);
	}

	const cancel = () => {
		if (window.history.length > 2)
			navigate(-1);
		else
			navigate('/');
	}

	const handleProposalStateChange = async (propId, newState) => {
		const success = await updateCandidatureProposalState(token, propId, newState, setStatus, setErrorMessage);
		if (success) {
			// Reload the entire candidature to get updated proposal states
			const data = await getCandidature(token, id, setStatus, setErrorMessage);
			if (data) {
				setCandidature(data);
				setState(data.state); // Also update candidature state if it changed
			}
		}
	};


	const Row = ({ id, proposal_title, company_name, state }) => {

		// Table row for editing proposals
		return (
			<tr className='table-row'>
				<th><p>{id}</p></th>
				<th><p>{proposal_title}</p></th>
				<th><p>{company_name}</p></th>
				<th>
					{/* Proposal State Dropdown */}
					<Dropdown text='' value={state} setValue={(val) => handleProposalStateChange(id, val)}>
						<option value="pending">Pendente</option>
						<option value="accepted">Aceite</option>
						<option value="rejected">Rejeitado</option>
					</Dropdown>
				</th>
				<th>
					<div className='d-flex gap-2'>
						{/* Actions if needed */}
					</div>
				</th>
			</tr>
		);
	}


	if (loading) return <div className="p-4">Loading...</div>;
	if (!candidature) return <div className="p-4">Candidature not found</div>;
	if (!isAcademicServices) return <div className="p-4 justify-content-center d-flex"> <Alert text="Sem permissões para editar." type="danger" /> </div>;

	return (
		<div id='candidature' className='d-flex flex-column'>

			<section className='row p-0'>
				<h4>Editar Candidatura</h4>
				{errorMessage && <div className="alert alert-danger">{errorMessage}</div>}
				<div className='d-flex flex-column gap-3'>

					<div className="row">
						<Dropdown className='col-4' text='Estado da Candidatura' value={state} setValue={setState}>
							{availableStates.map(st => (
								<option key={st.value} value={st.value}>{st.label}</option>
							))}
						</Dropdown>
					</div>

				</div>
			</section>

			<section className='p-0'>
				<h4>Propostas</h4>

				{candidature.proposals.length === 0 && <Alert text='Não existem propostas' type='danger' />}

				{candidature.proposals.length > 0 && (
					<table>
						<thead>
							<tr className='header'>
								<th><p>#</p></th>
								<th><p>Proposta</p></th>
								<th><p>Empresa/Docente</p></th>
								<th><p>Estado</p></th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							{candidature.proposals.map(proposal => (
								<Row key={proposal.id} {...proposal} />
							))}
						</tbody>
					</table>
				)}

			</section>

			<section className="buttons d-flex flex-row gap-3 col-sm-12 col-md-5 p-0">
				<PrimaryButton action={submit} content={<h6>Guardar</h6>} />
				<SecundaryButton action={cancel} content={<h6>Cancelar</h6>} />
			</section>
		</div>
	);

}

export default Edit;