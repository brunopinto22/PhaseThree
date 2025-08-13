import './view.css';
import { useState, useEffect, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PrimaryButtonSmall, Alert, OptionButton } from '../../../../components';
import { getCourse } from '../../../../services'
import { UserContext } from '../../../../contexts';

function View() {
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

	const edit = () => {
		navigate("/course/edit?id=" + id);
	}

	const [status, setStatus] = useState([]);
	const [error, setError] = useState([]);

	const [course, setCourse] = useState({
		course_name: "",
		scientific_area_name: "",
		course_description: "",
		website: "",
		commission_email: "",
		nStudents: 0,
		nTeachers: 0,
		nProposals: 0,
		branches: [],
		commission: [],
		calendars: []
	});


	useEffect(() => {
		async function fetchCourse() {
			if (!id) {
				navigate('/pagenotfound');
				return;
			}

			const data = await getCourse(localStorage.getItem("access_token"), id, setStatus, setError);

			if (status === 404) {
				navigate('/pagenotfound');
				return;
			}
			if (status === 200 && data) {
				setCourse(data);
			}
		}
		fetchCourse();
	}, [id, navigate, status]);


	const title = course.course_name;
	const area = course.scientific_area_name;
	const description = course.course_description;
	const branches = course.branches;
	const commission = course.commission;
	const website = course.website;
	const email = course.commission_email;
	const nStudents = course.nStudents;
	const nTeachers = course.nTeachers;
	const nProposals = course.nProposals;
	const calendars = course.calendars;

	const canEdit = role === "admin" || permissions["Cursos"].edit;

	const canEditCalendars = role === "admin" || permissions["Calendários"].edit;
	const canDeleteCalendars = role === "admin" || permissions["Calendários"].delete;

	const [seeC, setSeeC] = useState(true);


	const Row = ({id, title, submissionStart, submissionEnd, registrations, divulgation, candidatures, placements, active = true}) => {
		
		const view = () => {
			navigate("/calendar/view?id="+id);
		}

		const edit = () => {
			navigate("/calendar/edit?id="+id);
		}

		return(
			<tr className={`table-row ${active ? '' : 'inactive'}`}>
				<th><p>{title}</p></th>
				<th><p>{submissionStart}</p></th>
				<th><p>{submissionEnd}</p></th>
				<th><p>{registrations}</p></th>
				<th><p>{divulgation}</p></th>
				<th><p>{candidatures}</p></th>
				<th><p>{placements}</p></th>
				<th className='fit-column'>
					<div className='d-flex gap-2'>
						<OptionButton type='view' action={view} />
						{canEditCalendars && <OptionButton type='edit' action={edit} />}
						{canDeleteCalendars && <OptionButton type='delete' action={view} />}
					</div>
				</th>
			</tr>
		);
	}
	

	return(
		<div id="course" className='d-flex flex-column flex-md-column'>
			
			<div className="d-flex flex-row" style={{gap: "inherit"}}>
				<div className="main col d-flex flex-column p-0">
					<div className="title d-flex flex-column gap-2">
						<h3>{title}</h3>
						<h6 className='sub'>{area}</h6>
					</div>
					<p>{description}</p>
					{branches?.length > 0 &&
						<section className='branches d-flex flex-column p-0'>
							<h4>Ramos:</h4>
								{branches.map((branch, index) => (
									<p key={index} className="branch d-flex flex-row">
										<i className={`bi bi-circle-fill ${branch.color}`}></i>{branch.branch_acronym} - {branch.branch_name}
									</p>
								))}
						</section>
					}
				
					{commission?.length > 0 &&
						<section className='admins d-flex flex-column p-0'>
							<h4>Comissão de Curso:</h4>
							<ul className='d-flex flex-column'>
								{commission.map((e, index) => (
									<li key={index}>
										{e.is_responsible ? (
											<p><b>{e.teacher_name}</b> - <a href={`mailto:`+ e.teacher_email}>{e.teacher_email}</a></p>
										) : (
											<p>{e.teacher_name} - <a href={`mailto:`+ e.teacher_email}>{e.teacher_email}</a></p>
										)}
									</li>
								))}
							</ul>
						</section>
					}
				</div>
				<div className="col-md-3 p-0">
					<div className="sidebar d-flex flex-column">
						<h5 className='title'>Informação:</h5>
						<div className="content d-flex flex-column">
							<p className='d-flex flex-row align-items-center'><i className="bi bi-envelope"></i><b>Contacto: </b><a href={`mailto:`+ email}>{email}</a></p>
							<p className='d-flex flex-row align-items-center'><i className="bi bi-people"></i><b>Alunos: </b>{nStudents}</p>
							<p className='d-flex flex-row align-items-center'><i className="bi bi-people"></i><b>Docentes: </b>{nTeachers}</p>
							<p className='d-flex flex-row align-items-center'><i className="bi bi-file-earmark-text"></i><b>Propostas: </b>{nProposals}</p>
							<p className='d-flex flex-row align-items-center'><i className="bi bi-list-ul"></i><b>Ramos: </b>{branches.length}</p>
						</div>
						<div className="d-flex flex-column gap-3">
							<PrimaryButtonSmall action={() => window.open(website, "_blank", "noreferrer")} className='w-100' content={<p>Mais Informação</p>} />
							{canEdit && <PrimaryButtonSmall action={edit} className='w-100' content={<p>Editar Curso</p>} />}
						</div>
					</div>
				</div>
			</div>

			<section className='calendars d-flex flex-column p-0'>
					<div className="d-flex flex-row align-content-center justify-content-between">
						<h4 className='d-flex flex-row align-items-center gap-2 noselect' style={{cursor: "default"}} onClick={() => setSeeC(!seeC)}>
							<i className={`toggle-collapse bi bi-chevron-down`} style={{ transform: `rotateZ(${seeC ? "0" : "-90deg"})` }}></i>
							<span>Calendários</span>
						</h4>
						{canEdit && (<PrimaryButtonSmall action={() => navigate("/calendar/edit?new=true&course="+id)} content={<div className='d-flex flex-row gap-2'><i className="bi bi-plus-lg"></i><p>Adicionar calendário</p></div>} />)}
					</div>
					<div className={`collapsible ${seeC ? "" : "collapse"}`}>
						{calendars.length === 0 && <Alert text='Não existe nenhum calendário de momento' />}

						{calendars.length > 0 && (
							<table>
								<tr className='header'>
									<th><p>Ano Letivo/Semestre</p></th>
									<th><p>Inicio Submissões</p></th>
									<th><p>Fim Submissões</p></th>
									<th><p>Inscrição de Alunos</p></th>
									<th><p>Divulgação</p></th>
									<th><p>Candidaturas</p></th>
									<th><p>Colocações</p></th>
									<th></th>
								</tr>

								{calendars.map(calendar => (
									<Row key={calendar.id} {...calendar} />
								))}
								
							</table>
						)}
					</div>
				</section>

		</div>
	);

}

export default View;