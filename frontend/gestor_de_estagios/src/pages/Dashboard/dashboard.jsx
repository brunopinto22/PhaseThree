import './dashboard.css';
import { useState, useEffect, useContext } from 'react';
import { DashButton, Calendar } from '../../components';
import { useNavigate } from 'react-router-dom';
import { getCounts } from '../../helpers';
import { UserContext } from '../../contexts';

function Dashboard() {

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

	useEffect(() => {
    if (!userInfo) return;
  }, [userInfo, permissions, role, navigate]);

	const [adm, setAdm] = useState({
		nCourses: 0,
		nTeachers: 0,
		nStudents: 0,
		nCompanies: 0,
		nRepresentatives: 0,
	})
	const nCourses = adm.nCourses;
	const nTeachers = adm.nTeachers;
	const nStudents = adm.nStudents;
	const nCompanies = adm.nCompanies;
	const nRepresentatives = adm.nRepresentatives;

	useEffect(() => {
		async function fetch() {
			const data = await getCounts();
			setAdm(data);
		}
		fetch();
	}, []);

  return(
    <div className='dashboard row'>

			<div className='modules d-flex flex-column col-sm-12 col-md-8'>
				<h3>Dashboard</h3>
				
				<div className='modules-btns d-flex flex-column d-md-grid'>

					{role === 'student' &&
						(
							<>
							<DashButton
								icon={<i className="bi bi-clipboard2-plus-fill"></i>} // TODO : submeter candidatura de um aluno (PÁGINAS)
								text="Submeter Candidatura"
								action={() => navigate("/proposal/edit?new=true")}
							/>
							
							<DashButton
								action={() => navigate("/proposal/list")}
								icon={<i className="bi bi-file-earmark-text-fill"></i>}
								text="Ver Propostas"
							/>

							<DashButton
								icon={<i className="bi bi-clipboard2-pulse-fill"></i>}
								text="Candidatura"
								action={() => navigate("/candidature/view?id=1")}
							/>
							</>
						)
					}

					{role === 'representative' &&
						(
							<>
							<DashButton
								action={() => navigate("/proposal/list")}
								icon={<i className="bi bi-file-earmark-text-fill"></i>}
								text="Ver Propostas"
							/>

							<DashButton
								icon={<i className="bi bi-book-fill"></i>}
								text="Ver Cursos"
								action={() => navigate("/course/list")}
							/>

							<DashButton
								icon={<i className="bi bi-file-earmark-plus-fill"></i>}
								text="Submeter Proposta"
								action={() => navigate("/proposal/edit?new=true")}
							/>

							<DashButton
								icon={<i className="bi bi-person-plus-fill"></i>}
								text="Convidar Representante"
								action={() => navigate("/representative/invite?id=1")}
							/>
							</>
						)
					}

					{role === 'teacher' &&
						(
							<>
								<DashButton icon={<i className="bi bi-file-earmark-plus-fill"></i>} text='Submeter Proposta' action={() => navigate("/proposal/edit?new=true&type=project")} />
								<DashButton action={() => navigate("/proposal/list?self=true")} icon={<i className="bi bi-file-earmark-text-fill"></i>} text='As Minhas Propostas' />
								<DashButton icon={<i className="bi bi-compass-fill"></i>} text='Orientação' />
							</>
						)
					}


					{(permissions['Docentes'] && (permissions['Docentes'].view || permissions['Docentes'].edit || permissions['Docentes'].delete) || role === 'admin') && (
						<DashButton
							action={() => navigate("/teacher/list")}
							icon={<i className="bi bi-person-workspace"></i>}
							text="Gerir Docentes"
						/>
					)}
					{(permissions['Cursos'] && (permissions['Cursos'].view || permissions['Cursos'].edit || permissions['Cursos'].delete) || role === 'admin') && (
						<DashButton
							icon={<i className="bi bi-book-fill"></i>}
							text="Gerir Cursos"
							action={() => navigate("/course/list")}
						/>
					)}
					{(permissions['Alunos'] && (permissions['Alunos'].view || permissions['Alunos'].edit || permissions['Alunos'].delete) || role === 'admin') && (
						<DashButton
							icon={<i className="bi bi-person-fill"></i>}
							text="Gerir Alunos"
							action={() => navigate("/student/list")}
						/>
					)}
					{(permissions['Candidaturas'] && (permissions['Candidaturas'].view || permissions['Candidaturas'].edit || permissions['Candidaturas'].delete) || role === 'admin') && (
						<DashButton
							icon={<i className="bi bi-clipboard2-check-fill"></i>}
							text="Gerir Candidaturas"
							action={() => navigate("/candidature/list")}
						/>
					)}
					{(permissions['Empresas'] && (permissions['Empresas'].view || permissions['Empresas'].edit || permissions['Empresas'].delete) || role === 'admin') && (
						<DashButton
							icon={<i className="bi bi-building-fill"></i>}
							text="Gerir Empresas"
							action={() => navigate("/company/list")}
						/>
					)}
					{(permissions['Propostas'] && (permissions['Propostas'].view || permissions['Propostas'].edit || permissions['Propostas'].delete) || role === 'admin') && (
						<DashButton
							action={() => navigate("/proposal/list")}
							icon={<i className="bi bi-file-earmark-text-fill"></i>}
							text="Gerir Propostas"
						/>
					)}
					{role === 'admin' && (
						<DashButton
							action={() => navigate("/settings")}
							icon={<i className="bi bi-gear-fill"></i>}
							text='Definições'
						/>
					)}

				</div>
			</div>

			<div className="col-sm-12 col-md-4 mt-5 m-md-0">
				{role === 'admin' && (
					<div className='sidebar admin d-flex flex-column'>
						<h5>Informação:</h5>
						<div className='content-admin d-flex flex-column gap-2'>
							<div className='d-flex flex-row gap-2'><i className="bi bi-book"></i><b>Cursos:</b>{nCourses}</div>
							<div className='d-flex flex-row gap-2'><i className="bi bi-person-workspace"></i><b>Docentes:</b>{nTeachers}</div>
							<div className='d-flex flex-row gap-2'><i className="bi bi-person-fill"></i><b>Alunos:</b>{nStudents}</div>
							<div className='d-flex flex-row gap-2'><i className="bi bi-building-fill"></i><b>Empresas:</b>{nCompanies}</div>
							<div className='d-flex flex-row gap-2'><i className="bi bi-people-fill"></i><b>Representantes:</b>{nRepresentatives}</div>
						</div>
					</div>
				)}

				{role !== 'admin' && (
					<Calendar />
				)}
			</div>

		</div>
  );

}

export default Dashboard;