import './dashboard.css';
import { useState, useEffect, useContext } from 'react';
import { DashButton } from '../../components';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../contexts';
import SideBar from './SideBar/sideBar';

const Dashboard = () => {

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

  return(
    <div id="dashboard" className='row'>

			<div className='modules d-flex flex-column col-sm-12 col-md-8'>
				<h3>Dashboard</h3>
				
				<div className='modules-btns d-flex flex-column d-md-grid'>

					{role === 'student' &&
						(
							<>
							<DashButton
								icon={<i className="bi bi-clipboard2-plus-fill"></i>} // TODO : submeter candidatura de um aluno (PÁGINAS)
								text="Submeter Candidatura"
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
				<SideBar />
			</div>

		</div>
  );

}

export default Dashboard;