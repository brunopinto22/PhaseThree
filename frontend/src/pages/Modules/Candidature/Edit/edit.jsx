import './edit.css';

import { useState, useEffect, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PrimaryButton, SecundaryButton, Alert, CheckBox } from '../../../../components';
import { UserContext } from '../../../../contexts';
import { getMyCandidature, submitCandidature, updateCandidature, getCandidatureById, updateCandidatureState, getCandidatureHistory, updateCandidatureProposalState } from '../../../../services';
import { listProposals } from '../../../../services/proposals';
import HistoryTimeline from '../../../../components/HistoryTimeline/historyTimeline';

// Mapeamento de estados para labels em português
const STATE_LABELS = {
	'submitted': 'Pendente',
	'revision': 'Em Revisão',
	'placed': 'Colocado',
	'accepted': 'Aceite',
	'rejected': 'Rejeitado',
	'protocol_generated': 'Protocolo Gerado',
	'presidency_signature': 'Protocolo ISEC',
	'company_signature': 'Protocolo Empresa',
	'student_signature': 'Protocolo Aluno',
	'in_internship': 'Em estágio',
	'finished': 'Finalizado'
};

// Mapeamento do fluxo de estados
const STATE_FLOW = {
	'protocol_generated': 'presidency_signature',
	'presidency_signature': 'company_signature',
	'company_signature': 'student_signature',
	'student_signature': 'in_internship',
	'in_internship': 'finished'
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
	const [selectedProposals, setSelectedProposals] = useState([]); // Array ordenado de IDs
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
						// Já tem candidatura - modo edição
						setCandidature(data);
						// Extrair IDs ordenados por prioridade
						const orderedIds = data.proposals
							.sort((a, b) => a.priority - b.priority)
							.map(p => p.id);
						setSelectedProposals(orderedIds);
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

	const moveUp = (index) => {
		if (index === 0) return;
		const newSelected = [...selectedProposals];
		[newSelected[index - 1], newSelected[index]] = [newSelected[index], newSelected[index - 1]];
		setSelectedProposals(newSelected);
	};

	const moveDown = (index) => {
		if (index === selectedProposals.length - 1) return;
		const newSelected = [...selectedProposals];
		[newSelected[index], newSelected[index + 1]] = [newSelected[index + 1], newSelected[index]];
		setSelectedProposals(newSelected);
	};

	const submit = async () => {
		setError('');
		setSuccess('');

		if (!isValid()) {
			setError(`Deve selecionar entre ${minProposals} e ${maxProposals} propostas`);
			return;
		}

		// Converter para formato com prioridades
		const proposalsWithPriority = selectedProposals.map((id, index) => ({
			id: id,
			priority: index + 1
		}));

		if (candidature) {
			const result = await updateCandidature(
				userInfo.token,
				candidature.id_candidature,
				proposalsWithPriority,
				setStatus,
				setError
			);

			if (result) {
				setSuccess('Candidatura atualizada com sucesso!');
				setTimeout(() => navigate('/candidature/view'), 1500);
			}
		} else {
			const result = await submitCandidature(
				userInfo.token,
				proposalsWithPriority,
				setStatus,
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
			setSuccess('Estado avançado com sucesso!');
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

				<td><p>{proposal.title}</p></td>
				<td><p>{proposal.company?.name || 'ISEC'}</p></td>
				<td><p>{proposal.location}</p></td>
				<td><p>{proposal.type === 1 ? 'Estágio' : proposal.type === 2 ? 'Projeto' : proposal.type}</p></td>
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
										onClick={() => handleQuickStateChange('rejected', 'rejeitada')}
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
							candidatureData.state === 'student_signature' ||
							candidatureData.state === 'in_internship') && (
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
							candidatureData.state === 'student_signature' ||
							candidatureData.state === 'in_internship') && (
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

				<HistoryTimeline history={history} />

				{/* Histórico
				{history.length > 0 && (
					<section className='p-0'>
						<h5>Histórico de Mudanças</h5>
						<div className="table-container shadow-sm">
							<table>
								<thead>
									<tr className='header'>
										<th><p>Data</p></th>
										<th><p>De</p></th>
										<th><p>Para</p></th>
										<th><p>Por</p></th>
										<th className="notes-column"><p>Notas</p></th>
									</tr>
								</thead>
								<tbody>
									{history.map(entry => (
										<tr key={entry.id}>
											<td><p>{entry.changed_at}</p></td>
											<td><p>{STATE_LABELS[entry.old_state] || entry.old_state || '-'}</p></td>
											<td><p>{STATE_LABELS[entry.new_state] || entry.new_state}</p></td>
											<td><p>{entry.changed_by.email}</p></td>
											<td className="notes-column"><p>{entry.notes || '-'}</p></td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</section>
				)} */}


			</div>
		);
	}

	// UI para Estudantes (original)
	const selectedCount = selectedProposals.length;
	const counterClass = selectedCount < minProposals || selectedCount > maxProposals ? 'error' : 'success';

	const SelectedProposalRow = ({ proposalId, index }) => {
		const proposal = proposals.find(p => p.id === proposalId);
		if (!proposal) return null;

		return (
			<tr className='table-row'>
				<td>
					<div className="priority-badge">{index + 1}ª</div>
				</td>

				<td><p>{proposal.title}</p></td>
				<td><p>{proposal.company?.name || 'ISEC'}</p></td>
				<td>
					<div className="priority-actions">
						<button
							className="btn-icon"
							onClick={() => moveUp(index)}
							disabled={index === 0}
							title="Mover para cima"
						>
							<i className="bi bi-arrow-up"></i>
						</button>
						<button
							className="btn-icon"
							onClick={() => moveDown(index)}
							disabled={index === selectedProposals.length - 1}
							title="Mover para baixo"
						>
							<i className="bi bi-arrow-down"></i>
						</button>
					</div>
				</td>
			</tr>
		);
	};

	return (
		<div id='candidature' className='d-flex flex-column'>

			<section className='row p-0'>
				<h4>{candidature ? 'Editar Candidatura' : 'Submeter Candidatura'}</h4>

				<div className='candidature-counter'>
					<h5 className={counterClass}>
						{selectedCount} / {maxProposals} propostas selecionadas
					</h5>

					{selectedCount > maxProposals && (
						<Alert text={`Máximo: ${maxProposals} propostas`} type='danger' />
					)}
				</div>

				{error && <Alert text={error} type='danger' />}
				{success && <Alert text={success} type='success' />}
			</section>

			<section className='p-0'>
				<h4>1. Selecione as Propostas</h4>
				<p className='text-muted'>Escolha entre {minProposals} e {maxProposals} propostas</p>

				{proposals.length === 0 && (
					<Alert text='Não existem propostas disponíveis no momento' type='danger' />
				)}

				{proposals.length > 0 && (
					<div className="table-container shadow-sm mt-3">
						<table>
							<thead>
								<tr className='header'>
									<th></th>
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
					</div>
				)}
			</section>

			{selectedProposals.length > 0 && (
				<section className='p-0'>
					<h4>2. Defina a Ordem de Prioridade</h4>
					<p className='text-muted'>Use as setas para ordenar as propostas por preferência (1ª escolha no topo)</p>

					<div className="table-container shadow-sm mt-3">
						<table>
							<thead>
								<tr className='header'>
									<th style={{ width: '80px' }}><p>Ordem</p></th>
									<th><p>Título</p></th>
									<th><p>Empresa</p></th>
									<th style={{ width: '120px' }}><p>Ações</p></th>
								</tr>
							</thead>
							<tbody>
								{selectedProposals.map((proposalId, index) => (
									<SelectedProposalRow
										key={proposalId}
										proposalId={proposalId}
										index={index}
									/>
								))}
							</tbody>
						</table>
					</div>
				</section >
			)}

			<section className="buttons d-flex flex-row gap-3 col-sm-12 col-md-5 p-0">
				<PrimaryButton
					action={submit}
					content={<h6>{candidature ? 'Atualizar' : 'Submeter'}</h6>}
					disabled={!isValid()}
				/>
				<SecundaryButton action={cancel} content={<h6>Cancelar</h6>} />
			</section>
		</div >
	);

}

export default Edit;