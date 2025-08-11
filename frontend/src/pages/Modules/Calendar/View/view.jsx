import './view.css';
import { useContext, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PrimaryButtonSmall } from '../../../../components';
import Proposals from './Lists/proposals';
import Students from './Lists/students';
import { UserContext } from '../../../../contexts';
import { getCalendar } from '../../../../services/calendars';
import { formatDate } from '../../../../helpers';

const View = () => {

	const navigate = useNavigate();
	const { userInfo } = useContext(UserContext);
	const role = userInfo?.role;
	const permissions = userInfo?.perms || {
		Calendários: { view: false, edit: false, delete: false },
		Cursos: { view: false, edit: false, delete: false },
		Alunos: { view: false, edit: false, delete: false },
		Docentes: { view: false, edit: false, delete: false },
		Empresas: { view: false, edit: false, delete: false },
		Propostas: { view: false, edit: false, delete: false },
		Candidaturas: { view: false, edit: false, delete: false },
	};
	const [searchParams] = useSearchParams();
	const id = searchParams.get('id');

	const [status, setStatus] = useState([]);
	const [error, setError] = useState([]);

	const [calendar, setCalendar] = useState({
		title: "",
		course_id: 0,
		course_name: "",
		submission_start: "",
		submission_end: "",
		divulgation: "",
		candidatures: "",
		placements: "",
		mix: 0,
		max: 0,
		students: [],
		students_count: 0,
		proposals: [],
		proposals_count: 0,
	});

	useEffect(() => {
		async function fetchCalendar() {
			if (!id) {
				navigate('/pagenotfound');
				return;
			}

			const data = await getCalendar(localStorage.getItem("access_token"), id, setStatus, setError);

			if (status === 404) {
				navigate('/pagenotfound');
				return;
			}
			if (status === 200 && data) {
				setCalendar(data);
			}
		}
		fetchCalendar();
	}, [id, navigate, status]);

	const title = calendar.title;
	const course_id = calendar.course_id;
	const course = calendar.course_name;
	const submissionStart = formatDate(calendar.submission_start);
	const submissionEnd = formatDate(calendar.submission_end);
	const divulgation = formatDate(calendar.divulgation);
	const candidatures = formatDate(calendar.candidatures);
	const placements = formatDate(calendar.placements);
	const registrations = formatDate(calendar.registrations);
	const min = calendar.min;
	const max = calendar.max;
	const students = calendar.students;
	const nStudents = calendar.students_count;
	const proposals = calendar.proposals;
	const nProposals = calendar.proposals_count;

	const [seeP, setSeeP] = useState(false);
	const [seeS, setSeeS] = useState(false);

	const canEdit = role === "admin" || permissions["Calendários"].edit;

	return (
		<div id="calendar" className='d-flex flex-column'>

			<div className="d-flex flex-column flex-md-row justify-content-between gap-4">
				<div className="title-container d-flex flex-column">
					<h4 className="title">{title}</h4>
					<h6 className="sub-title" onClick={() => navigate("/course/view?id=" + course_id)}><a className='text-link'>{course}</a></h6>
				</div>
				{canEdit && <PrimaryButtonSmall className='h-100' content={<p>Editar Calendário</p>} action={() => navigate("/calendar/edit?id=" + id)} />}
			</div>

			<div className="dates d-flex flex-column flex-md-row justify-content-between gap-4">
				<p><b>Submissão de propostas: </b>{submissionStart} a {submissionEnd}</p>
				<p><b>Divulgação de propostas: </b>{divulgation}</p>
				<p><b>Candidaturas: </b>{candidatures}</p>
				<p><b>Colocações: </b>{placements}</p>
				<p><b>Inscrição de Alunos: </b>{registrations}</p>
				<p><b>Limite de Candidaturas: </b>{min} a {max}</p>
			</div>

			<div className='proposals d-flex flex-column gap-4'>
				<div className="d-flex flex-row align-content-center">
					<h4 className='title d-flex flex-row align-items-center gap-2 noselect' style={{ cursor: "default" }} onClick={() => setSeeP(!seeP)}>
						<i className={`toggle-collapse bi bi-chevron-down`} style={{ transform: `rotateZ(${seeP ? "0" : "-90deg"})` }}></i>
						<span>Propostas{nProposals > 0 && <span style={{fontSize: "small"}}> ({nProposals} {nProposals === 1 ? "proposta" : "propostas"})</span>}</span>
					</h4>
				</div>
				<div className={`collapsible ${seeP ? "" : "collapse"}`}>
					<Proposals list={proposals} />
				</div>
			</div>

			<div className='proposals d-flex flex-column gap-4'>
				<div className="d-flex flex-row align-content-center">
					<h4 className='title d-flex flex-row align-items-center gap-2 noselect' style={{ cursor: "default" }} onClick={() => setSeeS(!seeS)}>
						<i className={`toggle-collapse bi bi-chevron-down`} style={{ transform: `rotateZ(${seeS ? "0" : "-90deg"})` }}></i>
						<span>Alunos{nStudents > 0 && <span style={{fontSize: "small"}}> ({nStudents} {nStudents === 1 ? "aluno" : "alunos"})</span>}</span>
					</h4>
				</div>
				<div className={`collapsible ${seeS ? "" : "collapse"}`}>
					<Students list={students} />
				</div>
			</div>

		</div>
	);

}

export default View;