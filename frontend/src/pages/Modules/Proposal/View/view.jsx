import './view.css';
import default_pfp from './../../../../assets/imgs/default_pfp.jpg';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PrimaryButtonSmall, Pill } from '../../../../components';
import { useContext, useEffect, useState } from 'react';
import { UserContext } from '../../../../contexts';
import { getProposal } from '../../../../services/proposals';

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
	const [status, setStatus] = useState(0);
	const [error, setError] = useState("");
	const [searchParams] = useSearchParams();

  const id = searchParams.get('id');

	const [proposal, setProposal] = useState({
		proposal_number: 0,
		title: "",
		description: "",
		technologies: "",
		methodologies: "",
		objectives: "",
		scheduling: "",
		selection: "",
		conditions: "",
		format: "",
		local: "",
		schedule: "",
		slots: 0,
		taken: 0,
		course: { id: 0, name: "" },
		branches: [],
		calendar: { id: 0, title: "" },
		type: 1,
		company: { id: null, title: "" },
		advisor: { id: null, name: "", email: "" },
		isec_advisor: { id: null, name: "", email: "" }
	});

	useEffect(() => {
		async function fetchProposal() {
			if (!id) {
				navigate('/pagenotfound');
				return;
			}

			const data = await getProposal(localStorage.getItem("access_token"), id, setStatus, setError);

			if (status === 404) {
				navigate('/pagenotfound');
				return;
			}
			if (status === 200 && data) {
				setProposal(data);
			}
		}
		fetchProposal();
	}, [id, navigate, status]);

	const types = ["Estágio", "Projeto"];
	const formats = ["Presencial", "Híbrido", "Remoto"];

	const proposal_number = proposal.proposal_number;
	const title = proposal.title;
	const description = proposal.description;
	const technologies = proposal.technologies;
	const methodologies = proposal.methodologies;
	const objective = proposal.objectives;
	const scheduling = proposal.scheduling;
	const selection_method = proposal.selection;
	const conditions = proposal.conditions;
	const format = formats[proposal.format-1];
	const location = proposal.local;
	const schedule = proposal.schedule;
	const slots = proposal.slots;
	const taken = proposal.taken;
	const course = proposal.course;
	const branches = proposal.branches;
	const calendar = proposal.calendar;
	const type = types[proposal.type-1];
	const company = proposal.company;
	const responsible = proposal.advisor;
	const responsible_ISEC = proposal.isec_advisor;

	const canEdit = (role === "admin" || (role === "representative" && userInfo.company) || (role === "teacher" && permissions["Propostas"].edit));

	return(
		<div id="proposal" className='d-flex flex-column flex-md-row'>
			<div className="main col d-flex flex-column p-0">

				<div className="title-container d-flex flex-column">
					<h5 className="number">#{proposal_number}</h5>
					<h3 className="title">{title}</h3>
					<h4 className="company">{company.id !== null ? <a href={`/company/view?id=${company.id}`} className="text-link">{company.title}</a> : <span>{company.title}</span>}</h4>
					<div className="d-flex flex-row gap-2 mt-3">
						<Pill className='noselect' type={type} />
						<Pill className='noselect' type={format} />
					</div>
				</div>

				{description && (
					<section>
						<h6 className='title'>Descrição:</h6>
						<p>{description}</p>
					</section>
				)}

				{objective && (
					<section>
						<h6 className='title'>Objetivos:</h6>
						<p>{objective}</p>
					</section>
				)}

				{technologies && (
					<section>
						<h6 className='title'>Tecnologias:</h6>
						<p>{technologies}</p>
					</section>
				)}

				{methodologies && (
					<section>
						<h6 className='title'>Metodologia:</h6>
						<p>{methodologies}</p>
					</section>
				)}

				{scheduling && (
					<section>
						<h6 className='title'>Calendarização:</h6>
						<p>{scheduling}</p>
					</section>
				)}

				{selection_method && (
					<section>
						<h6 className='title'>Processo de Seleção:</h6>
						<p>{selection_method}</p>
					</section>
				)}

				{conditions && (
					<section>
						<h6 className='title'>Condições oferecidas:</h6>
						<p>{conditions}</p>
					</section>
				)}


			</div>

			<div className="p-0">
				<div className="sidebar d-flex flex-column">
					<div className="content d-flex flex-column">

						<h5 className='title'>Informação:</h5>

						<div className="pills d-flex flex-row gap-2">
							{branches.map((branch) => (
								<Pill text={branch.acronym} tooltip={branch.name} color={branch.color} className='noselect' />
							))}
						</div>

						<div className="divider"><hr /></div>

						<div className="d-flex flex-row align-items-center gap-1">
							<i className="bi bi-book"></i><b>Curso: </b><p>{course.title}</p>
						</div>

						<div className="d-flex flex-row align-items-center gap-1">
							<i className="bi bi-calendar"></i><b>Calendário: </b><p>{calendar.title}</p>
						</div>

						<div className="divider"><hr /></div>

						<div className="d-flex flex-row align-items-center gap-1">
							<i className="bi bi-geo-alt"></i><b>Local: </b><p>{location}</p>
						</div>

						<div className="d-flex flex-row align-items-center gap-1">
							<i className="bi bi-suitcase-lg"></i><b>Vagas: </b><p>{taken} / {slots}</p>
						</div>

						<div className="d-flex flex-row align-items-center gap-1">
							<i className="bi bi-clock"></i><b>Horário: </b><p>{schedule}</p>
						</div>

						<div className="divider"><hr /></div>

						{responsible && 
							<div className="d-flex flex-row align-items-center gap-1">
								<i className="bi bi-person-fill"></i><b>Orientador da Entidade: </b><p>{responsible.name}</p>
							</div>
						}

						{responsible_ISEC &&
							<div className="d-flex flex-row align-items-center gap-1">
								<i className="bi bi-person-fill"></i><b>Orientador do ISEC: </b><p>{responsible_ISEC.name}</p>
							</div>
						}

					</div>

					<div className="btns d-flex flex-column">
						<PrimaryButtonSmall content={<p>Proposta</p>}/>
						{(canEdit) && <PrimaryButtonSmall content={<p>Editar Proposta</p>} action={() => navigate("/proposal/edit?id="+id)} />}
					</div>
				</div>
			</div>
		</div>
	);

}

export default View;