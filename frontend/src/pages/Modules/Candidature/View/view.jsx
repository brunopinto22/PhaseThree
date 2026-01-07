import './view.css';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useContext } from 'react';
import { PrimaryButton, SecundaryButton, Alert } from '../../../../components';
import { UserContext } from '../../../../contexts';
import { getMyCandidature } from '../../../../services';

function View() {

	const navigate = useNavigate();
	const { userInfo } = useContext(UserContext);
	const [status, setStatus] = useState(null);
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(true);

	const [candidature, setCandidature] = useState(null);
	const [calendar, setCalendar] = useState(null);

	useEffect(() => {
		const fetchData = async () => {
			const data = await getMyCandidature(userInfo.token, setStatus, setError);
			
			if (data) {
				setCalendar(data.calendar);
				
				if (data.has_candidature) {
					setCandidature(data);
				}
			}
			
			setLoading(false);
		};

		fetchData();
	}, [userInfo.token]);

	const handleSubmit = () => {
		navigate('/candidature/edit');
	};

	const handleEdit = () => {
		navigate('/candidature/edit');
	};

	const ProposalRow = ({ proposal }) => {
		const stateMap = {
			'pending': { text: 'Pendente', class: 'warning' },
			'accepted': { text: 'Aceite', class: 'success' },
			'rejected': { text: 'Rejeitada', class: 'danger' }
		};
		
		const stateInfo = stateMap[proposal.state] || stateMap['pending'];

		return (
			<tr className='table-row'>
				<td><p>{proposal.id}</p></td>
				<td><p>{proposal.title}</p></td>
				<td><p>{proposal.company?.name || 'ISEC'}</p></td>
				<td>
					<span className={`badge badge-${stateInfo.class}`}>{stateInfo.text}</span>
				</td>
			</tr>
		);
	};

	if (loading) {
		return (
			<div id='candidature' className='d-flex flex-column'>
				<h3>A carregar...</h3>
			</div>
		);
	}

	const hasCandidature = candidature !== null;
	const canEdit = hasCandidature && candidature.state === 'submitted';

	return(
		<div id='candidature' className='d-flex flex-column'>

			<section className='row p-0'>
				<h3>Minha Candidatura</h3>
				
				{error && <Alert text={error} type='danger' />}

				{calendar && (
					<div className='calendar-info'>
						<h5>Informações do Calendário</h5>
						<p><strong>Limites:</strong> Entre {calendar.min} e {calendar.max} propostas</p>
						<p><strong>Prazo de Candidaturas:</strong> {calendar.candidatures_deadline}</p>
					</div>
				)}
			</section>

			{hasCandidature ? (
				<>
					<section className='candidature-details p-0'>
						<h4>Detalhes da Candidatura</h4>
						<div className='details-grid'>
							<div className='detail-item'>
								<strong>Estado:</strong> 
								<span className='state'> {candidature.state}</span>
							</div>
							<div className='detail-item'>
								<strong>Submetida em:</strong> {candidature.submission_date}
							</div>
						</div>
					</section>

					<section className='p-0'>
						<h4>Propostas Selecionadas ({candidature.proposals.length} / {calendar.max})</h4>
						
						{candidature.proposals.length === 0 ? (
							<Alert text='Nenhuma proposta selecionada' type='warning' />
						) : (
							<table>
								<thead>
									<tr className='header'>
										<th><p>#</p></th>
										<th><p>Título</p></th>
										<th><p>Empresa</p></th>
										<th><p>Estado</p></th>
									</tr>
								</thead>
								<tbody>
									{candidature.proposals.map(proposal => (
										<ProposalRow key={proposal.id} proposal={proposal} />
									))}
								</tbody>
							</table>
						)}
					</section>

					<section className="buttons d-flex flex-row gap-3 col-sm-12 col-md-6 p-0">
						<SecundaryButton 
							action={handleSubmit}
							content={
								<div className='d-flex flex-column align-items-center'>
									<h6>Submeter Candidatura</h6>
									<small className='text-muted'>Só é possível ter uma candidatura ativa</small>
								</div>
							}
							disabled={true}
						/>
						<PrimaryButton 
							action={handleEdit}
							content={<h6>Editar Candidatura</h6>}
							disabled={!canEdit}
						/>
					</section>
				</>
			) : (
				<>
					<section className='no-candidature p-0'>
						<Alert text='Você ainda não submeteu uma candidatura' type='info' />
						<p>Clique no botão abaixo para selecionar suas propostas e submeter sua candidatura.</p>
					</section>

					<section className="buttons d-flex flex-row gap-3 col-sm-12 col-md-6 p-0">
						<PrimaryButton 
							action={handleSubmit}
							content={<h6>Submeter Candidatura</h6>}
						/>
						<SecundaryButton 
							action={handleEdit}
							content={<h6>Editar Candidatura</h6>}
							disabled={true}
						/>
					</section>
				</>
			)}

		</div>
	);

}

export default View;