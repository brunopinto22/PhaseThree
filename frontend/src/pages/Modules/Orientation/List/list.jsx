import './list.css';
import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, State, OptionButton } from '../../../../components';
import { getMyStudents } from '../../../../services';
import { UserContext } from '../../../../contexts';

const List = () => {

	const navigate = useNavigate();
	const { userInfo } = useContext(UserContext);
	const token = userInfo?.token;
	const role = userInfo?.role;

	const [students, setStudents] = useState([]);
	const [loading, setLoading] = useState(true);
	const [status, setStatus] = useState(null);
	const [errorMessage, setErrorMessage] = useState("");

	useEffect(() => {
		const fetchData = async () => {
			if (!token) return;
			setLoading(true);
			const data = await getMyStudents(token, setStatus, setErrorMessage);
			if (data) {
				setStudents(data);
			}
			setLoading(false);
		};
		fetchData();
	}, [token]);

	const getRoleLabel = () => {
		if (role === 'teacher') return 'Orientador ISEC';
		if (role === 'representative') return 'Orientador da Entidade';
		return 'Orientador';
	};

	const Row = ({ student, proposal, candidature_state, role: advisorRole }) => {
		
		const viewStudent = () => {
			navigate("/student/view?id=" + student.number);
		};
		
		const viewProposal = () => {
			navigate("/proposal/view?id=" + proposal.id);
		};

		const viewCurriculum = () => {
			if (student.curriculum) {
				window.open(student.curriculum, '_blank');
			}
		};

		return (
			<tr className='table-row'>
				<th><State state={candidature_state} hideState={true} hideText={true} tooltip={true} /></th>
				<th className='fit-column text-center'><p>{student.number}</p></th>
				<th><p>{student.name}</p></th>
				<th><p>{student.email}</p></th>
				<th><p>{student.course}</p></th>
				<th className='text-center'><p>{student.average || '—'}</p></th>
				<th>
					<span 
						className='text-link' 
						onClick={viewProposal}
						style={{ cursor: 'pointer' }}
					>
						#{proposal.number} - {proposal.title}
					</span>
				</th>
				<th>
					<div className='d-flex gap-2'>
						<OptionButton type='view' action={viewStudent} tooltip="Ver Aluno" />
						{student.curriculum && (
							<OptionButton type='download' action={viewCurriculum} tooltip="Ver CV" />
						)}
					</div>
				</th>
			</tr>
		);
	};

	if (loading) {
		return (
			<div className='orientation-list d-flex flex-column'>
				<div className="top d-flex flex-row justify-content-between">
					<div className="title"><h4>Orientação - Os Meus Alunos</h4></div>
				</div>
				<Alert text='A carregar...' type='info' />
			</div>
		);
	}

	return (
		<div className='orientation-list d-flex flex-column'>

			<div className="top d-flex flex-row justify-content-between align-items-center mb-3">
				<div className="title">
					<h4><i className="bi bi-compass me-2"></i>Orientação - Os Meus Alunos</h4>
					<p className="text-muted">{getRoleLabel()}</p>
				</div>
			</div>

			{errorMessage && <Alert text={errorMessage} type='danger' />}

			{students.length === 0 && !errorMessage && (
				<div className="empty-state text-center p-5">
					<i className="bi bi-people" style={{ fontSize: '4rem', color: '#ccc' }}></i>
					<h5 className="mt-3">Ainda não tem alunos atribuídos</h5>
					<p className="text-muted">
						Os alunos serão atribuídos após o processo de colocações.
					</p>
				</div>
			)}

			{students.length > 0 && (
				<>
					<div className="summary-cards d-flex gap-3 mb-4 flex-wrap">
						<div className="summary-card p-3 rounded border">
							<h2 className="m-0">{students.length}</h2>
							<small className="text-muted">Alunos Atribuídos</small>
						</div>
						<div className="summary-card p-3 rounded border">
							<h2 className="m-0">{students.filter(s => s.candidature_state === 'placed').length}</h2>
							<small className="text-muted">Colocados</small>
						</div>
						<div className="summary-card p-3 rounded border">
							<h2 className="m-0">{students.filter(s => s.candidature_state === 'finished').length}</h2>
							<small className="text-muted">Em Estágio</small>
						</div>
					</div>

					<table>
						<thead>
						<tr className='header'>
							<th className='fit-column'><p>Estado</p></th>
							<th className='fit-column'><p>Nº</p></th>
							<th><p>Aluno</p></th>
							<th><p>Email</p></th>
							<th><p>Curso</p></th>
							<th className='fit-column'><p>Média</p></th>
							<th><p>Proposta</p></th>
							<th className='fit-column'></th>
						</tr>
						</thead>
						<tbody>
						{students.map((item, index) => (
							<Row key={`${item.student.number}-${item.proposal.id}-${index}`} {...item} />
						))}
						</tbody>
					</table>
				</>
			)}

		</div>
	);

};

export default List;

