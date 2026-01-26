import './edit.css';

import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { PrimaryButton, SecundaryButton, Alert, CheckBox } from '../../../../components';
import { UserContext } from '../../../../contexts';
import { getMyCandidature, submitCandidature, updateCandidature } from '../../../../services';
import { listProposals } from '../../../../services/proposals';

const Edit = () => {

	const navigate = useNavigate();
	const { userInfo } = useContext(UserContext);
	const [status, setStatus] = useState(null);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');

	const [candidature, setCandidature] = useState(null);
	const [proposals, setProposals] = useState([]);
	const [selectedProposals, setSelectedProposals] = useState([]);
	const [minProposals, setMinProposals] = useState(1);
	const [maxProposals, setMaxProposals] = useState(6);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchData = async () => {
			// Buscar todas as propostas disponíveis usando o serviço correto
			const allProposals = await listProposals(userInfo.token, setStatus, setError);
			setProposals(allProposals);
			
			// Depois obter candidatura para ver quais já estão selecionadas
			const data = await getMyCandidature(userInfo.token, setStatus, setError);
			
			if (data) {
				// Extrair limites do calendário
				setMinProposals(data.calendar.min);
				setMaxProposals(data.calendar.max);

				if (data.has_candidature) {
					// Já tem candidatura - modo edição
					setCandidature(data);
					// Extrair IDs das propostas já selecionadas
					const selectedIds = data.proposals.map(p => p.id);
					setSelectedProposals(selectedIds);
				}
			}

			setLoading(false);
		};

		fetchData();
	}, [userInfo.token]);

	const toggleProposal = (proposalId) => {
		setSelectedProposals(prev => {
			if (prev.includes(proposalId)) {
				// Remover proposta
				return prev.filter(id => id !== proposalId);
			} else {
				// Adicionar proposta se não ultrapassar o máximo
				if (prev.length < maxProposals) {
					return [...prev, proposalId];
				}
				return prev;
			}
		});
	};

	const isValid = () => {
		return selectedProposals.length >= 1 && 
		       selectedProposals.length <= maxProposals;
	};

	const submit = async () => {
		setError('');
		setSuccess('');

		if (!isValid()) {
			setError(`Deve selecionar entre 1 e ${maxProposals} propostas`);
			return;
		}

		if (candidature) {
			// Atualizar candidatura existente
			const result = await updateCandidature(
				userInfo.token, 
				candidature.id_candidature, 
				selectedProposals,
				setStatus,
				setError
			);
			
			if (result) {
				setSuccess('Candidatura atualizada com sucesso!');
				setTimeout(() => navigate('/candidature/view'), 1500);
			}
		} else {
			// Criar nova candidatura
			const result = await submitCandidature(
				userInfo.token, 
				selectedProposals,
				setStatus,
				setError
			);
			
			if (result) {
				setSuccess('Candidatura submetida com sucesso!');
				setTimeout(() => navigate('/candidature/view'), 1500);
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
			<tr className={`table-row ${isSelected ? 'selected' : ''}`}>
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

	const selectedCount = selectedProposals.length;
	const counterClass = selectedCount < 1 || selectedCount > maxProposals ? 'error' : 'success';

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
				<h4>Propostas Disponíveis</h4>
				<p className='text-muted'>Selecione entre 1 e {maxProposals} propostas</p>

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