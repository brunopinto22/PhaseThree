import './list.css';
import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { OptionButton, SecundaryButton, Alert, State } from '../../../../components';
import { getAllCandidatures } from '../../../../services/candidatures';
import { UserContext } from '../../../../contexts';

const List = () => {

	const navigate = useNavigate();
	const { userInfo } = useContext(UserContext);

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [status, setStatus] = useState(null);

	const iconMap = [
		"bi-arrow-clockwise",
		"bi-check2",
		"bi-file-binary",
		"bi-journal-bookmark-fill",
		"bi-building-check",
		"bi-journal-check",
		"bi-rocket-fill",
	];

	const text = [
		"Pendente",
		"Colocado",
		"Protocolo Gerado",
		"Protocolo ISEC",
		"Protocolo Empresa",
		"Protocolo Aluno",
		"Em estágio",
	]

	const btnClass = [
		"pending",
		"accpeted",
		"protocol-generated",
		"protocol-isec",
		"protocol-company",
		"protocol-student",
		"start",
	];

	const [list, setList] = useState([]);

	// Mapear estados do backend para números do frontend
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

	useEffect(() => {
		async function fetchCandidatures() {
			setLoading(true);
			const data = await getAllCandidatures(userInfo.token, setStatus, setError);

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
		}

		if (userInfo?.token) {
			fetchCandidatures();
		}
	}, [userInfo]);


	const exportList = () => {
	}


	const Row = ({ id, studentName, studentNumber, companyName, proposalName, state }) => {

		const view = () => {
			navigate("/candidature/view?id=" + id);
		}
		const edit = () => {
			navigate("/candidature/edit?id=" + id);
		}
		const handleDelete = () => {
			// TODO : eliminar Candidatura
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
						<OptionButton type='view' action={view} />
						<OptionButton type='edit' action={edit} />
						<OptionButton type='delete' action={handleDelete} />
					</div>
				</th>
			</tr>
		);
	}

	return (
		<div className='candidatures-list d-flex flex-column'>

			<div className="top d-flex flex-row justify-content-between">
				<div className="title"><h4>Candidaturas</h4></div>

				<div className="filters"></div>

				<div className="options d-flex gap-3">
					<SecundaryButton small action={exportList} content={<div className='d-flex flex-row gap-2'><i className="bi bi-download"></i><p>Exportar colocações</p></div>} />
				</div>
			</div>

			<div className="captions d-flex flex-row align-items-center gap-3">
				{iconMap.map((icon, index) => (
					<><div className={`cap noselect d-flex flex-row align-items-center gap-2 ${btnClass[index]}`}><i className={`bi ${icon}`}></i><p>{text[index]}</p></div>{index < iconMap.length - 1 && (<p>|</p>)}</>
				))}
			</div>

			{loading && <Alert text='A carregar candidaturas...' />}
			{error && <Alert text={error} />}
			{!loading && !error && list.length === 0 && <Alert text='Não existem candidaturas de momento' />}

			{!loading && !error && list.length > 0 && (
				<table>
					<tr className='header'>
						<th className='fit-column'><p>Estado</p></th>
						<th className='fit-column'><p>Nº aluno</p></th>
						<th><p>Aluno</p></th>
						<th><p>Empresa/Docente</p></th>
						<th><p>Proposta</p></th>
						<th className='fit-column'></th>
					</tr>

					{list.map(candidature => (
						<Row key={candidature.id} {...candidature} />
					))}

				</table>
			)}

		</div>
	);

}

export default List;