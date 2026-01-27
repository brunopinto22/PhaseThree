import './list.css';
import { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { OptionButton, SecundaryButton, Alert, State } from '../../../../components';
import { getAllCandidatures, deleteCandidature } from '../../../../services/candidatures';
import { UserContext } from '../../../../contexts';

const List = () => {

	const navigate = useNavigate();
	const { userInfo } = useContext(UserContext);

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	const iconMap = [
		"bi-hourglass-split",
		"bi-check2",
		"bi-clipboard-check",
		"bi-clipboard-x",
		"bi-file-binary",
		"bi-journal-bookmark-fill",
		"bi-building-check",
		"bi-journal-check",
		"bi-rocket-fill",
		"bi-flag-fill",
	]

	const text = [
		"Pendente",
		"Colocado",
		"Aceite",
		"Rejeitado",
		"Protocolo Gerado",
		"Protocolo ISEC",
		"Protocolo Empresa",
		"Protocolo Aluno",
		"Em estágio",
		"Finalizado",
	]

	const btnClass = [
		"pending",
		"placed",
		"accepted",
		"rejected",
		"protocol-generated",
		"protocol-isec",
		"protocol-company",
		"protocol-student",
		"in-internship",
		"finished",
	]

	const [list, setList] = useState([]);

	const fetchCandidatures = useCallback(async () => {
		setLoading(true);
		// Mapear estados do backend para números do frontend
		const stateMap = {
			'submitted': 1,
			'revision': 1,
			'placed': 2,
			'accepted': 3,
			'rejected': 4,
			'protocol_generated': 5,
			'presidency_signature': 6,
			'company_signature': 7,
			'student_signature': 8,
			'in_internship': 9,
			'finished': 10,
		};

		const data = await getAllCandidatures(userInfo.token, () => { }, setError);

		if (data) {
			// Mapear dados da API para o formato do componente
			const mappedData = data.map(candidature => ({
				id: candidature.id,
				studentName: candidature.studentName,
				studentNumber: candidature.studentNumber,
				companyName: candidature.companyName,
				proposalName: candidature.proposalName,
				state: stateMap[candidature.state] || 1,
			}));
			setList(mappedData);
		}
		setLoading(false);
	}, [userInfo.token, setError]);

	useEffect(() => {
		if (userInfo?.token) {
			fetchCandidatures();
		}
	}, [userInfo.token, fetchCandidatures]);


	const exportList = () => {
	}


	const Row = ({ id, studentName, studentNumber, companyName, proposalName, state }) => {

		const edit = () => {
			navigate("/candidature/edit?id=" + id);
		}

		const handleDelete = async () => {
			if (window.confirm(`Tem a certeza que deseja apagar a candidatura do aluno ${studentNumber}? Esta ação é irreversível.`)) {
				const res = await deleteCandidature(userInfo.token, id, () => { }, setError);
				if (res) {
					// Recarregar lista
					fetchCandidatures();
				}
			}
		}

		return (
			<tr className='table-row'>
				<th><State state={state} hideState={true} hideText={true} tooltip={true} /></th>
				<th className='fit-column text-center'><p>{studentNumber}</p></th>
				<th><p>{studentName}</p></th>
				<th><p>{state > 1 ? (companyName) : '—'}</p></th>
				<th><p>{state > 1 ? (proposalName) : '—'}</p></th>
				<th>
					<div className='d-flex gap-2'>
						<OptionButton type='edit' action={edit} />
						<OptionButton type='delete' action={handleDelete} />
					</div>
				</th>
			</tr>
		);
	}

	return (
		<div className='candidatures-list d-flex flex-column'>

			<div className="top d-flex flex-wrap flex-row justify-content-between align-items-center gap-3">
				<div className="title"><h4>Candidaturas</h4></div>

				<div className="options d-flex gap-3">
					<SecundaryButton small action={exportList} content={<div className='d-flex flex-row gap-2'><i className="bi bi-download"></i><p>Exportar colocações</p></div>} />
				</div>
			</div>

			<div className="captions noselect d-flex flex-wrap gap-2">
				{iconMap.map((icon, index) => (
					<div key={index} className={`cap d-flex flex-row align-items-center gap-2 ${btnClass[index]}`}>
						<i className={`bi ${icon}`}></i>
						<p>{text[index]}</p>
					</div>
				))}
			</div>

			{loading && <Alert text='A carregar candidaturas...' />}
			{error && <Alert text={error} />}
			{!loading && !error && list.length === 0 && <Alert text='Não existem candidaturas de momento' />}

			{!loading && !error && list.length > 0 && (
				<div className="table-container shadow-sm">
					<table>
						<thead>
							<tr className='header'>
								<th className='fit-column'><p>Estado</p></th>
								<th className='fit-column'><p>Nº aluno</p></th>
								<th><p>Aluno</p></th>
								<th><p>Empresa/Docente</p></th>
								<th><p>Proposta</p></th>
								<th className='fit-column'></th>
							</tr>
						</thead>
						<tbody>
							{list.map(candidature => (
								<Row key={candidature.id} {...candidature} />
							))}
						</tbody>
					</table>
				</div>
			)}

		</div>
	);

}

export default List;