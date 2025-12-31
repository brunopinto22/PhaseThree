import './list.css';
import { useState, useEffect, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { OptionButton, SecundaryButton, Alert, State } from '../../../../components';
import { listCandidatures, deleteCandidature } from '../../../../services';
import { UserContext } from '../../../../contexts';

const List = () => {

	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const { userInfo } = useContext(UserContext);
	const token = userInfo?.token;

	const calendarId = searchParams.get("calendar");

	const [list, setList] = useState([]);
	const [loading, setLoading] = useState(true);
	const [status, setStatus] = useState(null);
	const [errorMessage, setErrorMessage] = useState("");

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			const data = await listCandidatures(token, calendarId, setStatus, setErrorMessage);
			if (data) {
				setList(data);
			}
			setLoading(false);
		};
		fetchData();
	}, [token, calendarId]);

	const exportList = () => {
		// TODO: implement export functionality
	}

	const handleDelete = async (id) => {
		if (!window.confirm("Tem a certeza que deseja eliminar esta candidatura?")) return;
		
		const success = await deleteCandidature(token, id, setStatus, setErrorMessage);
		if (success) {
			setList(list.filter(c => c.id !== id));
		}
	}

	const Row = ({ id, student, state, proposals_count, accepted_proposal, can_edit, can_delete }) => {
		
		const view = () => {
			navigate("/candidature/view?id=" + id);
		}
		const edit = () => {
			navigate("/candidature/edit?id=" + id);
		}

		return (
			<tr className='table-row'>
				<th><State state={state} hideState={true} hideText={true} tooltip={true} /></th>
				<th className='fit-column text-center'><p>{student.number}</p></th>
				<th><p>{student.name}</p></th>
				<th><p>{accepted_proposal ? accepted_proposal.company : '—'}</p></th>
				<th><p>{accepted_proposal ? accepted_proposal.title : `${proposals_count} proposta(s)`}</p></th>
				<th>
					<div className='d-flex gap-2'>
						<OptionButton type='view' action={view} />
						{can_edit && <OptionButton type='edit' action={edit} />}
						{can_delete && <OptionButton type='delete' action={() => handleDelete(id)} />}
					</div>
				</th>
			</tr>
		);
	}

	if (loading) {
		return (
			<div className='candidatures-list d-flex flex-column'>
				<div className="top d-flex flex-row justify-content-between">
					<div className="title"><h4>Candidaturas</h4></div>
				</div>
				<Alert text='A carregar...' type='info' />
			</div>
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

			<div className="captions d-flex flex-row align-items-center gap-3 flex-wrap">
				<div className="cap noselect d-flex flex-row align-items-center gap-2 pending"><i className="bi bi-arrow-clockwise"></i><p>Submetido</p></div>
				<p>|</p>
				<div className="cap noselect d-flex flex-row align-items-center gap-2 accpeted"><i className="bi bi-check2"></i><p>Colocado</p></div>
				<p>|</p>
				<div className="cap noselect d-flex flex-row align-items-center gap-2 protocol-generated"><i className="bi bi-file-binary"></i><p>Protocolo Gerado</p></div>
				<p>|</p>
				<div className="cap noselect d-flex flex-row align-items-center gap-2 protocol-isec"><i className="bi bi-journal-bookmark-fill"></i><p>Assinatura ISEC</p></div>
				<p>|</p>
				<div className="cap noselect d-flex flex-row align-items-center gap-2 protocol-company"><i className="bi bi-building-check"></i><p>Assinatura Empresa</p></div>
				<p>|</p>
				<div className="cap noselect d-flex flex-row align-items-center gap-2 protocol-student"><i className="bi bi-journal-check"></i><p>Assinatura Aluno</p></div>
				<p>|</p>
				<div className="cap noselect d-flex flex-row align-items-center gap-2 start"><i className="bi bi-rocket-fill"></i><p>Concluído</p></div>
			</div>

			{errorMessage && <Alert text={errorMessage} type='danger' />}

			{list.length === 0 && !errorMessage && <Alert text='Não existe nenhuma candidatura de momento' />}

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
