import './edit.css';

import { useState, useEffect, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PrimaryButton, SecundaryButton, Alert, CheckBox } from '../../../../components';
import { UserContext } from '../../../../contexts';
import { getMyCandidature, submitCandidature, updateCandidature, getCandidatureById, updateCandidatureState, getCandidatureHistory, updateCandidatureProposalState } from '../../../../services';
import { listProposals } from '../../../../services/proposals';

// Mapeamento de estados para labels em português
const STATE_LABELS = {
	'submitted': 'Submetida',
	'revision': 'Em Revisão',
	'placed': 'Colocada',
	'protocol_generated': 'Protocolo Gerado',
	'presidency_signature': 'Assinatura ISEC',
	'company_signature': 'Assinatura da Empresa',
	'student_signature': 'Assinatura do Aluno',
	'finished': 'Finalizada'
};

// Mapeamento do fluxo de estados
const STATE_FLOW = {
	'protocol_generated': 'presidency_signature',
	'presidency_signature': 'company_signature',
	'company_signature': 'student_signature',
	'student_signature': 'finished'
};


const Edit = () => {

	const navigate = useNavigate();
	const { userInfo } = useContext(UserContext);
	const [searchParams] = useSearchParams();
	const candidatureIdParam = searchParams.get('id');

	const [status, setStatus] = useState(null);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');

	// Estados para estudantes
	const [candidature, setCandidature] = useState(null);
	const [proposals, setProposals] = useState([]);
	const [selectedProposals, setSelectedProposals] = useState([]);
	const [minProposals, setMinProposals] = useState(1);
	const [maxProposals, setMaxProposals] = useState(6);

	// Estados para admin/academic services
	const [candidatureData, setCandidatureData] = useState(null);
	const [selectedState, setSelectedState] = useState('');
	const [stateNotes, setStateNotes] = useState('');
	const [history, setHistory] = useState([]);

	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchData = async () => {

			// Esperar até userInfo estar carregado
			if (!userInfo || !userInfo.role) {
				setLoading(false); // Remove loading para evitar loop infinito
				return;
			}

			if (userInfo.role === 'student') {
				// Lógica para estudantes (manter a original)
				const allProposals = await listProposals(userInfo.token, () => { }, setError);
				setProposals(allProposals);

				const data = await getMyCandidature(userInfo.token, () => { }, setError);

				if (data) {
					setMinProposals(data.calendar.min);
					setMaxProposals(data.calendar.max);

					if (data.has_candidature) {
						setCandidature(data);
						const selectedIds = data.proposals.map(p => p.id);
						setSelectedProposals(selectedIds);
					}
				}
				setLoading(false);
			} else if (userInfo.role === 'admin' || userInfo.role === 'academic_services') {
				// Lógica para admin/academic services
				if (!candidatureIdParam) {
					setError('ID de candidatura não fornecido');
					setLoading(false);
					return;
				}

				const data = await getCandidatureById(userInfo.token, candidatureIdParam, () => { }, setError);

				if (data) {
					setCandidatureData(data);
					setSelectedState(data.state);

					// Buscar histórico
					const historyData = await getCandidatureHistory(userInfo.token, candidatureIdParam, () => { }, setError);
					if (historyData) {
						setHistory(historyData.history);
					}
				}
				setLoading(false);
			} else {
				setLoading(false);
				navigate('/');
			}
		};

		fetchData();
	}, [userInfo, userInfo?.token, userInfo?.role, navigate, candidatureIdParam]);

	// Funções para estudantes
	const toggleProposal = (proposalId) => {
		setSelectedProposals(prev => {
			if (prev.includes(proposalId)) {
				return prev.filter(id => id !== proposalId);
			} else {
				if (prev.length < maxProposals) {
					return [...prev, proposalId];
				}
				return prev;
			}
		});
	};

	const isValid = () => {
		return selectedProposals.length >= minProposals &&
			selectedProposals.length <= maxProposals;
	};

	const submit = async () => {
		setError('');
		setSuccess('');

		if (!isValid()) {
			setError(`Deve selecionar entre ${minProposals} e ${maxProposals} propostas`);
			return;
		}

		if (candidature) {
			const result = await updateCandidature(
				userInfo.token,
				candidature.id_candidature,
				selectedProposals,
				() => { },
				setError
			);

			if (result) {
				setSuccess('Candidatura atualizada com sucesso!');
				setTimeout(() => navigate('/candidature/view'), 1500);
			}
		} else {
			const result = await submitCandidature(
				userInfo.token,
				selectedProposals,
				() => { },
				setError
			);

			if (result) {
				setSuccess('Candidatura submetida com sucesso!');
				setTimeout(() => navigate('/candidature/view'), 1500);
			}
		}
	};

	// Função para admin/academic services
	const handleStateUpdate = async () => {
		setError('');
		setSuccess('');

		if (!selectedState) {
			setError('Por favor selecione um estado');
			return;
		}

		const result = await updateCandidatureState(
			userInfo.token,
			candidatureIdParam,
			selectedState,
			stateNotes,
			() => { },
			setError
		);

		if (result) {
			setSuccess('Estado atualizado com sucesso!');
			// Recarregar dados
			const data = await getCandidatureById(userInfo.token, candidatureIdParam, () => { }, setError);
			if (data) {
				setCandidatureData(data);
				setSelectedState(data.state);
			}

			const historyData = await getCandidatureHistory(userInfo.token, candidatureIdParam, () => { }, setError);
			if (historyData) {
				setHistory(historyData.history);
			}

			setStateNotes('');
		}
	};

	// Função para ações rápidas (validar/rejeitar) no estado revision
	const handleQuickStateChange = async (newState, actionName) => {
		setError('');
		setSuccess('');

		// Preparar notas com prefixo baseado na ação
		const actionPrefix = newState === 'protocol_generated' ? 'Conta Validada' : 'Conta Rejeitada';
		const finalNotes = stateNotes.trim()
			? `${actionPrefix} - ${stateNotes}`
			: actionPrefix;

		const result = await updateCandidatureState(
			userInfo.token,
			candidatureIdParam,
			newState,
			finalNotes,
			() => { },
			setError
		);

		if (result) {
			setSuccess(`Candidatura ${actionName} com sucesso!`);
			// Recarregar dados
			const data = await getCandidatureById(userInfo.token, candidatureIdParam, () => { }, setError);
			if (data) {
				setCandidatureData(data);
				setSelectedState(data.state);
			}

			const historyData = await getCandidatureHistory(userInfo.token, candidatureIdParam, () => { }, setError);
			if (historyData) {
				setHistory(historyData.history);
			}

			setStateNotes('');
		}
	};

	// Função para avançar estado automaticamente
	const handleAdvanceState = async () => {
		setError('');
		setSuccess('');

		const currentState = candidatureData.state;
		const nextState = STATE_FLOW[currentState];

		if (!nextState) {
			setError('Não há próximo estado definido');
			return;
		}

		// Primeira mudança de estado
		const result = await updateCandidatureState(
			userInfo.token,
			candidatureIdParam,
			nextState,
			stateNotes,
			() => { },
			setError
		);

		if (result) {
			// Se estamos em company_signature, avançar mais um estado automaticamente
			if (currentState === 'company_signature') {
				// Aguardar um pouco para garantir que a primeira mudança foi registrada
				await new Promise(resolve => setTimeout(resolve, 500));

				// Segunda mudança: de student_signature para finished
				const secondResult = await updateCandidatureState(
					userInfo.token,
					candidatureIdParam,
					'finished',
					'', // Sem notas adicionais na segunda mudança
					() => { },
					setError
				);

				if (secondResult) {
					setSuccess('Estado avançado com sucesso!');
				}
			} else {
				setSuccess('Estado avançado com sucesso!');
			}

			// Recarregar dados
			const data = await getCandidatureById(userInfo.token, candidatureIdParam, () => { }, setError);
			if (data) {
				setCandidatureData(data);
				setSelectedState(data.state);
			}

			const historyData = await getCandidatureHistory(userInfo.token, candidatureIdParam, () => { }, setError);
			if (historyData) {
				setHistory(historyData.history);
			}

			setStateNotes('');
		}
	};

	const handleProposalStateUpdate = async (proposalId, newState) => {
		setError('');
		setSuccess('');

		const result = await updateCandidatureProposalState(
			userInfo.token,
			candidatureIdParam,
			proposalId,
			newState,
			setStatus,
			setError
		);

		if (result) {
			setSuccess(`Proposta ${newState === 'accepted' ? 'aceite' : 'rejeitada'} com sucesso!`);
			// Recarregar dados
			const data = await getCandidatureById(userInfo.token, candidatureIdParam, () => { }, setError);
			if (data) {
				setCandidatureData(data);
				setSelectedState(data.state);
			}
		}
	};

	const cancel = () => {
		if (window.history.length > 2)
			navigate(-1);
		else
			navigate('/');
	};

	const ProposalRow = ({ proposal }) => {
		const isSelected = selectedProposals.includes(proposal.id);
		const isDisabled = !isSelected && selectedProposals.length >= maxProposals;

		return (
			<tr className={`table - row ${isSelected ? 'selected' : ''} `}>
				<td>
					<CheckBox
						value={isSelected}
						setValue={() => toggleProposal(proposal.id)}
						disabled={isDisabled}
					/>
				</td>
				<td><p>{proposal.proposal_number || proposal.id}</p></td>
				<td><p>{proposal.title}</p></td>
				<td><p>{proposal.company?.name || 'ISEC'}</p></td>
				<td><p>{proposal.location}</p></td>
				<td><p>{proposal.type}</p></td>
			</tr>
		);
	};

	if (loading) {
		return (
			<div id='candidature' className='d-flex flex-column'>
				<h4>A carregar...</h4>
			</div>
		);
	}

	// UI para Admin/Academic Services
	if (userInfo?.role === 'admin' || userInfo?.role === 'academic_services') {
		if (!candidatureData) {
			return (
				<div id='candidature' className='d-flex flex-column'>
					<h4>Candidatura não encontrada</h4>
					{error && <Alert text={error} type='danger' />}
				</div>
			);
		}

		return (
			<div id='candidature' className='d-flex flex-column'>
				<section className='row p-0'>
					<h4>Gerir Candidatura #{candidatureData.id_candidature}</h4>

					{error && <Alert text={error} type='danger' />}
					{success && <Alert text={success} type='success' />}
				</section>

				{/* Informações do Estudante */}
				<section className='p-0'>
					<h5>Informações do Estudante</h5>
					<div className='info-grid'>
						<div><strong>Número:</strong> {candidatureData.student.student_number}</div>
						<div><strong>Nome:</strong> {candidatureData.student.student_name}</div>
						<div><strong>Email:</strong> {candidatureData.student.email}</div>
						<div><strong>Curso:</strong> {candidatureData.student.course || 'N/A'}</div>
						<div><strong>Estado Atual:</strong> <span className={`status-badge ${candidatureData.state}`}>{STATE_LABELS[candidatureData.state] || candidatureData.state}</span></div>
					</div>
				</section>


				{/* Gestão de Estado - Sempre Visível */}
				<section className='p-0'>
					<h5>Gestão de Estado</h5>
					<div className='state-management'>
						<div className='form-group'>
							<label><strong>Estado Atual:</strong></label>
							<p><span className={`status-badge ${candidatureData.state}`}>{STATE_LABELS[candidatureData.state] || candidatureData.state}</span></p>
						</div>

						{/* Acções para estado 'revision' */}
						{candidatureData.state === 'revision' && (
							<>
								<div className='form-group'>
									<label htmlFor='notes'><strong>Notas (opcional):</strong></label>
									<textarea
										id='notes'
										value={stateNotes}
										onChange={(e) => setStateNotes(e.target.value)}
										placeholder='Adicione observações sobre esta decisão...'
										rows={3}
									/>
								</div>

								<div className='d-flex gap-3 mt-2'>
									<SecundaryButton
										small
										action={cancel}
										content={<h6>Voltar</h6>}
									/>
									<button
										className='btn btn-danger btn-sm'
										onClick={() => handleQuickStateChange('finished', 'rejeitada')}
									>
										<i className="bi bi-x-circle me-2"></i>
										<h6 style={{ display: 'inline' }}>Rejeitar Conta do Aluno</h6>
									</button>
									<button
										className='btn btn-success btn-sm'
										onClick={() => handleQuickStateChange('protocol_generated', 'validada')}
									>
										<i className="bi bi-check-circle me-2"></i>
										<h6 style={{ display: 'inline' }}>Validar Conta do Aluno</h6>
									</button>
								</div>
							</>
						)}

						{/* Acções para estados de fluxo automático */}
						{(candidatureData.state === 'protocol_generated' ||
							candidatureData.state === 'presidency_signature' ||
							candidatureData.state === 'company_signature' ||
							candidatureData.state === 'student_signature') && (
								<>
									<div className='form-group'>
										<label><strong>Próximo Estado:</strong></label>
										<p>{STATE_LABELS[STATE_FLOW[candidatureData.state]] || STATE_FLOW[candidatureData.state]}</p>
									</div>

									<div className='form-group'>
										<label htmlFor='notes'><strong>Notas (opcional):</strong></label>
										<textarea
											id='notes'
											value={stateNotes}
											onChange={(e) => setStateNotes(e.target.value)}
											placeholder='Adicione observações sobre esta mudança...'
											rows={3}
										/>
									</div>

									<div className='d-flex gap-3 mt-2'>
										<SecundaryButton
											small
											action={cancel}
											content={<h6>Voltar</h6>}
										/>
										<PrimaryButton
											small
											action={handleAdvanceState}
											content={<h6>Avançar Estado</h6>}
										/>
									</div>
								</>
							)}

						{/* Se for apenas visualização (ex: finished, placed, submitted) */}
						{!(candidatureData.state === 'revision' ||
							candidatureData.state === 'protocol_generated' ||
							candidatureData.state === 'presidency_signature' ||
							candidatureData.state === 'company_signature' ||
							candidatureData.state === 'student_signature') && (
								<div className='d-flex gap-3 mt-2'>
									<SecundaryButton
										small
										action={cancel}
										content={<h6>Voltar</h6>}
									/>
								</div>
							)}
					</div>
				</section>

				{/* Histórico */}
				{history.length > 0 && (
					<section className='p-0'>
						<h5>Histórico de Mudanças</h5>
						<table>
							<thead>
								<tr className='header'>
									<th><p>Data</p></th>
									<th><p>De</p></th>
									<th><p>Para</p></th>
									<th><p>Por</p></th>
									<th><p>Notas</p></th>
								</tr>
							</thead>
							<tbody>
								{history.map(entry => (
									<tr key={entry.id}>
										<td><p>{entry.changed_at}</p></td>
										<td><p>{STATE_LABELS[entry.old_state] || entry.old_state || '-'}</p></td>
										<td><p>{STATE_LABELS[entry.new_state] || entry.new_state}</p></td>
										<td><p>{entry.changed_by.email}</p></td>
										<td><p>{entry.notes || '-'}</p></td>
									</tr>
								))}
							</tbody>
						</table>
					</section>
				)}


			</div>
		);
	}

	// UI para Estudantes (original)
	const selectedCount = selectedProposals.length;
	const counterClass = selectedCount < minProposals || selectedCount > maxProposals ? 'error' : 'success';

	return (
		<div id='candidature' className='d-flex flex-column'>

			<section className='row p-0'>
				<h4>{candidature ? 'Editar Candidatura' : 'Submeter Candidatura'}</h4>

				<div className='candidature-counter'>
					<h5 className={counterClass}>
						{selectedCount} / {maxProposals} propostas selecionadas
					</h5>
					{selectedCount < minProposals && (
						<Alert text={`Mínimo: ${minProposals} propostas`} type='warning' />
					)}
					{selectedCount > maxProposals && (
						<Alert text={`Máximo: ${maxProposals} propostas`} type='danger' />
					)}
				</div>

				{error && <Alert text={error} type='danger' />}
				{success && <Alert text={success} type='success' />}
			</section>

			<section className='p-0'>
				<h4>Propostas Disponíveis</h4>
				<p className='text-muted'>Selecione entre {minProposals} e {maxProposals} propostas</p>

				{proposals.length === 0 && (
					<Alert text='Não existem propostas disponíveis no momento' type='danger' />
				)}

				{proposals.length > 0 && (
					<table>
						<thead>
							<tr className='header'>
								<th></th>
								<th><p>#</p></th>
								<th><p>Título</p></th>
								<th><p>Empresa</p></th>
								<th><p>Localização</p></th>
								<th><p>Tipo</p></th>
							</tr>
						</thead>
						<tbody>
							{proposals.map(proposal => (
								<ProposalRow key={proposal.id} proposal={proposal} />
							))}
						</tbody>
					</table>
				)}
			</section>

			<section className="buttons d-flex flex-row gap-3 col-sm-12 col-md-5 p-0">
				<PrimaryButton
					action={submit}
					content={<h6>{candidature ? 'Atualizar' : 'Submeter'}</h6>}
					disabled={!isValid()}
				/>
				<SecundaryButton action={cancel} content={<h6>Cancelar</h6>} />
			</section>
		</div>
	);

}

export default Edit;