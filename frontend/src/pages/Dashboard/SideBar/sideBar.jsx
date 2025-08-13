import { useContext, useEffect, useState } from "react";
import { Alert } from "../../../components";
import { UserContext } from "../../../contexts";

const SideBar = ({type = null, summary = null, error = null}) => {

	return(
		<div className='sidebar d-flex flex-column'>
			{type === null || summary === null &&
				<>
					<Alert text={error || "Não existem dados disponíveis de momento."} small />
				</>
			}

			{type === "admin" && 
				<>
					<h5>Informação:</h5>
					<div className='d-flex flex-column gap-2'>
						<div className='d-flex flex-row gap-2'><i className="bi bi-book"></i><b>Cursos:</b>{summary?.nCourses}</div>
						<div className='d-flex flex-row gap-2'><i className="bi bi-person-workspace"></i><b>Docentes:</b>{summary?.nTeachers}</div>
						<div className='d-flex flex-row gap-2'><i className="bi bi-person-fill"></i><b>Alunos:</b>{summary?.nStudents}</div>
						<div className='d-flex flex-row gap-2'><i className="bi bi-building-fill"></i><b>Empresas:</b>{summary?.nCompanies}</div>
						<div className='d-flex flex-row gap-2'><i className="bi bi-people-fill"></i><b>Representantes:</b>{summary?.nRepresentatives}</div>
						<div className='d-flex flex-row gap-2'><i className="bi bi-file-earmark-text"></i><b>Propostas:</b> {summary?.nProposals}</div>
						<div className='d-flex flex-row gap-2'><i className="bi-clipboard2-check"></i><b>Candidaturas:</b> {summary?.nCandidatures}</div>
					</div>
				</>
			}

			{type === "teacher" && 
			<>
				<h5>Informação:</h5>
				
					{summary?.calendars &&
						<div className='d-flex flex-column gap-2'>
							<h6>Calendários Ativos</h6>
							{summary?.calendars.length > 0 ? (
								<>
									{summary?.calendars.map((c) => (
										<div key={c.id} className='d-flex flex-row gap-2'><a className="text-link" href={`/calendar/view?id=${c.id}`}>{c.title}</a></div>
									))}
								</>
							) : (
								<Alert text="Não existem calendários ativos de momento." small />
							)}
						</div>
					}

					{summary?.permissions && (
						<div className='d-flex flex-column gap-2'>
							<h6>Sistema</h6>
							{summary?.permissions.nCourses !== null && (
								<div className='d-flex flex-row gap-2'><i className="bi bi-book"></i><b>Cursos:</b> {summary?.permissions.nCourses}</div>
							)}
							{summary?.permissions.nTeachers !== null && (
								<div className='d-flex flex-row gap-2'><i className="bi bi-person-workspace"></i><b>Docentes:</b> {summary?.permissions.nTeachers}</div>
							)}
							{summary?.permissions.nStudents !== null && (
								<div className='d-flex flex-row gap-2'><i className="bi bi-person-fill"></i><b>Alunos:</b> {summary?.permissions.nStudents}</div>
							)}
							{summary?.permissions.nCompanies !== null && (
								<div className='d-flex flex-row gap-2'><i className="bi bi-building-fill"></i><b>Empresas:</b> {summary?.permissions.nCompanies}</div>
							)}
							{summary?.permissions.nCompanies !== null && (
								<div className='d-flex flex-row gap-2'><i className="bi bi-people-fill"></i><b>Representantes:</b>{summary?.permissions.nRepresentatives}</div>
							)}
							{summary?.permissions.nProposals !== null && (
								<div className='d-flex flex-row gap-2'><i className="bi bi-file-earmark-text"></i><b>Propostas:</b> {summary?.permissions.nProposals}</div>
							)}
							{summary?.permissions.nCandidatures !== null && (
								<div className='d-flex flex-row gap-2'><i className="bi-clipboard2-check"></i><b>Candidaturas:</b> {summary?.permissions.nCandidatures}</div>
							)}
						</div>
					)}

					{summary?.commission &&
						<div className='d-flex flex-column gap-2'>
							<h6>Comissão do Curso</h6>
							<div className='d-flex flex-row gap-2'><b>Curso:</b> <a className="text-link" href={`/course/view?id=${summary?.commission.course.id}`}>{summary?.commission.course.name}</a></div>
							<div className='d-flex flex-row gap-2'><i className="bi bi-person-workspace"></i><b>Docentes:</b> {summary?.commission.nTeachers}</div>
							<div className='d-flex flex-row gap-2'><i className="bi bi-person-fill"></i><b>Alunos:</b> {summary?.commission.nStudents}</div>
							<div className='d-flex flex-row gap-2'><i className="bi bi-calendar"></i><b>Calendários:</b> {summary?.commission.nCalendars}</div>
						</div>
					}

			</>
			}

			{type === "representative" && 
			<>
				<h5>Informação:</h5>
				
				<div className='d-flex flex-column gap-2'>
					<h6><a className="text-link" href={`/company/view?id=${summary?.company.id}`}>{summary?.company.name}</a></h6>
					<div className='d-flex flex-row gap-2'><i className="bi bi-people-fill"></i><b>Representantes:</b>{summary?.nRepresentatives}</div>
					<div className='d-flex flex-row gap-2'><i className="bi bi-file-earmark-text"></i><b>Propostas:</b> {summary?.nProposals}</div>
				</div>

				<div className='d-flex flex-column gap-2'>
					<h6>Calendários Ativos</h6>
					{summary?.calendars.length > 0 ? (
						<>
							{summary?.calendars.map((c) => (
								<div key={c.id} className='d-flex flex-row gap-2'><a className="text-link" href={`/calendar/view?id=${c.id}`}>{c.title}</a></div>
							))}
						</>
					) : (
						<Alert text="Não existem calendários ativos de momento." small />
					)}
				</div>
			</>
			}

			{type === "student" && 
			<>
				<div className="title d-flex flex-row align-items-center gap-3">
					<i className="bi bi-calendar-week"></i>
					<h4>Prazos</h4>
				</div>
				
				<div className='d-flex flex-column gap-2'>
					<div className='d-flex flex-row gap-2'><b>Calendário:</b><a className="text-link">{summary?.calendar.title}</a></div>
					<div className='d-flex flex-row gap-2'><b>Submissão de Propostas:</b><p>{summary?.calendar.submission_start} a {summary?.calendar.submission_end}</p></div>
					<div className='d-flex flex-row gap-2'><b>Divulgação de Projetos/Estágios:</b><p>{summary?.calendar.divulgation}</p></div>
					<div className='d-flex flex-row gap-2'><b>Candidaturas:</b><p>{summary?.calendar.candidatures}</p></div>
					<div className='d-flex flex-row gap-2'><b>Colocações:</b><p>{summary?.calendar.placements}</p></div>
				</div>

			</>
			}

		</div>
	);

}

export default SideBar;