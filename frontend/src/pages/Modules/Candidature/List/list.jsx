import './list.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { OptionButton, SecundaryButton, Alert, State } from '../../../../components';
import { listCandidatures } from '../../../../services/candidatures';

// Map backend state string to index/number logic expected by UI components
const stateMap = {
	'submitted': 0, // Pending
	'revision': 0, // Treat as pending/revision visually? Or add new index?
	'placed': 1,
	'protocol_generated': 2,
	'presidency_signature': 3,
	'company_signature': 4,
	'student_signature': 5,
	'finished': 6
};

const List = () => {

	const navigate = useNavigate();
	const token = localStorage.getItem("access_token");

	const iconMap = [
		"bi-arrow-clockwise",
		"bi-check2",
		"bi-file-binary",
		"bi-journal-bookmark-fill",
		"bi-building-check",
		"bi-journal-check",
		"bi-rocket-fill",
		"bi-flag-fill" // finished
	];

	const text = [
		"Pendente", // submitted
		"Em Revisão", // revision
		"Colocado", // placed
		"Protocolo Gerado",
		"Protocolo ISEC",
		"Protocolo Empresa",
		"Protocolo Aluno",
		"Terminado", // finished
	];

	const btnClass = [
		"pending", // submitted/revision
		"accpeted", // placed
		"protocol-generated",
		"protocol-isec",
		"protocol-company",
		"protocol-student",
		"start", // finished
	];

	const [list, setList] = useState([]);
	const [loading, setLoading] = useState(true);
	// eslint-disable-next-line
	const [status, setStatus] = useState(0);
	const [errorMessage, setErrorMessage] = useState("");

	useEffect(() => {
		const fetchList = async () => {
			if (!token) return;
			setLoading(true);
			const data = await listCandidatures(token, setStatus, setErrorMessage);
			if (data) {
				const formatted = data.map(item => ({
					...item,
					state: stateMap[item.state] !== undefined ? stateMap[item.state] + 1 : 1
				}));
				setList(formatted);
			}
			setLoading(false);
		};
		fetchList();
	}, [token]);

	const exportList = () => {
		// Implementation for export
	}

	const deleteCandidature = async (candidatureId) => {
		if (!window.confirm('Tem certeza que deseja eliminar esta candidatura?')) {
			return;
		}

		try {
			const res = await fetch(`${process.env.REACT_APP_API_URL}/candidature/${candidatureId}/delete`, {
				method: 'DELETE',
				headers: {
					'Authorization': token,
					'Content-Type': 'application/json'
				}
			});

			if (res.status === 200 || res.status === 204) {
				setList(list.filter(c => c.id !== candidatureId));
			} else {
				const data = await res.json();
				setErrorMessage(data.message || 'Erro ao eliminar candidatura');
			}
		} catch (error) {
			setErrorMessage('Erro de rede ao eliminar candidatura');
		}
	};


	const Row = ({ id, studentName, studentNumber, companyName, proposalName, state }) => {

		const view = () => {
			navigate("/candidature/view?id=" + id);
		}
		const edit = () => {
			navigate("/candidature/edit?id=" + id);
		}
		const handleDelete = () => {
			deleteCandidature(id);
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
					<div key={index} className={`cap noselect d-flex flex-row align-items-center gap-2 ${btnClass[index] || ''}`}><i className={`bi ${icon}`}></i><p>{text[index]}</p>{index < iconMap.length - 1 && (<p>|</p>)}</div>
				))}
			</div>

			{errorMessage && <div className="alert alert-danger mx-3">{errorMessage}</div>}
			{!loading && list.length === 0 && <Alert text='Não existem candidaturas de momento' />}
			{loading && <div className="p-3">Loading...</div>}

			{list.length > 0 && (
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
			)}

		</div>
	);

}

export default List;