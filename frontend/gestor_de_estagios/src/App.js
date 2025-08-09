import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

import { useContext, useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate, Outlet } from "react-router-dom";
import {
	Login, Dashboard, PageNotFound, Unauthorized, Settings,
	RegisterStudent, RegisterCompany, RegisterRepresentative,
	ListStudents, ViewStudent, EditStudent,
	ListCourses, ViewCourse, EditCourse,
	ListTeachers, ViewTeacher, EditTeacher,
	ListProposals, ViewProposal, EditProposal,
	ListCompanies, ViewCompanie, EditCompanie,
	ViewRepresentative, EditRepresentative,
	ListCandidatures, ViewCandidature, EditCandidature,
	ViewCalendar, EditCalendar,
	RegisterTeacher,
} from './pages';
import { Layout } from "./components";
import { testToken } from "./helpers";
import { CompanyProvider, UserContext, UserProvider } from "./contexts";


function App() {
	
	const d_perms = {
		Calendários: { view: false, edit: false, delete: false },
		Cursos: { view: false, edit: false, delete: false },
		Alunos: { view: false, edit: false, delete: false },
		Docentes: { view: false, edit: false, delete: false },
		Empresas: { view: false, edit: false, delete: false },
		Propostas: { view: false, edit: false, delete: false },
		Candidaturas: { view: false, edit: false, delete: false },
	};

	const { setUserInfo } = useContext(UserContext);
	
  const [id, setId] = useState(null);
  const [token, setToken] = useState(null);
	const [role, setRole] = useState(null);
	const [perms, setPerms] = useState(d_perms);
	const [company, setCompany] = useState(null);

	const [loading, setLoading] = useState(true); 

	useEffect(() => {
		const test_token = async () => {
			const storedId = localStorage.getItem("user_id");
			const storedToken = localStorage.getItem("access_token");
			const storedRole = localStorage.getItem("user_role");
			const storedPerms = localStorage.getItem("user_perms");
			const storedComp = localStorage.getItem("company_id");
			let p = d_perms;
			try {
				if (storedPerms && storedPerms !== "undefined") {
					p = JSON.parse(storedPerms);
				}
			} catch {
				p = d_perms;
			}

			if(await testToken(storedToken)) {
				setId(storedId);
				setToken(storedToken);
				setRole(storedRole);
				handlePerms(storedPerms);
				setCompany(storedComp);

				setUserInfo({
					id: storedId,
					token: storedToken,
					role: storedRole,
					perms: p,
					company: storedComp === undefined ? null : storedComp,
				});
			}
			else {
				setId(null);
				setToken(null);
				setRole(null);
				handlePerms(null);
				setCompany(null);

				setUserInfo({
					id: storedId,
					token: storedToken,
					role: storedRole,
					perms: p,
					company: storedComp === undefined ? null : storedComp,
				});
			}
			setLoading(false)
		};
		test_token();
	},[token]);

	const handlePerms = (perms) => {
		try {
			if (!perms || perms === "undefined") {
				setPerms(d_perms);
			} else {
				const parsed = JSON.parse(perms);
				setPerms(parsed);
			}
		} catch (e) {
			setPerms(d_perms);
		}
	}

	function RequireAuth({ token, loading, children }) {
		if (loading) {
			return null;
		}
		if (!token) {
			return <Navigate to="/login" replace />;
		}
		return children;
	}

	function RequireNoAuth({ token, loading, children }) {
		if (loading) {
			return null;
		}
		if (token) {
			return <Navigate to="/" replace />;
		}
		return children;
	}

	return (
		<CompanyProvider>

		<Router>
			<div className="App" style={{opacity: loading ? "0.8" : "1.0"}}>
				<Routes>

					{/* Login */}
					<Route
						path="/login"
						element={
							<RequireNoAuth token={token} loading={loading}>
								<Login setToken={setToken} />
							</RequireNoAuth>
						}
					/>

					{/* Register */}
					<Route
						path="/register"
						element={
							<RequireNoAuth token={token} loading={loading}>
								<Outlet />
							</RequireNoAuth>
						}
					>
						<Route path="teacher" element={<RegisterTeacher />} />
						<Route path="student" element={<RegisterStudent />} />
						<Route path="company" element={<RegisterCompany />} />
						<Route path="representative" element={<RegisterRepresentative />} />
					</Route>


					{/* Dashboard */}
					<Route path="/"
						element={
							<RequireAuth token={token} loading={loading}>
								<Layout setToken={setToken} />
							</RequireAuth>
						}
					>
						<Route index element={<Dashboard />} />

						{/* Manage Courses */}
						<Route path="/course">
							<Route path="list" element={<ListCourses />} />
							<Route path="view" element={<ViewCourse />} />
							<Route path="edit" element={<EditCourse />} />
						</Route>

						{/* Manage Calendars */}
						<Route path="/calendar">
							<Route path="view" element={<ViewCalendar />} />
							<Route path="edit" element={<EditCalendar />} />
						</Route>

						{/* Manage Students */}
						<Route path="/student">
							<Route path="list" element={<ListStudents />} />
							<Route path="view" element={<ViewStudent />} />
							<Route path="edit" element={<EditStudent />} />
						</Route>

						{/* Manage Teachers */}
						<Route path="/teacher">
							<Route path="list" element={<ListTeachers />} />
							<Route path="view" element={<ViewTeacher />} />
							<Route path="edit" element={<EditTeacher />} />
						</Route>

						{/* Manage Companies */}
						<Route path="/company">
							<Route path="list" element={<ListCompanies />} />
							<Route path="view" element={<ViewCompanie />} />
							<Route path="edit" element={<EditCompanie />} />
						</Route>

						{/* Manage Representatives */}
						<Route path="/representative">
							<Route path="view" element={<ViewRepresentative />} />
							<Route path="edit" element={<EditRepresentative />} />
						</Route>

						{/* Manage Proposals */}
						<Route path="/proposal">
							<Route path="list" element={<ListProposals />} />
							<Route path="view" element={<ViewProposal />} />
							<Route path="edit" element={<EditProposal />} />
						</Route>

						{/* Manage Candidatures */}
						<Route path="/candidature">
							<Route path="list" element={<ListCandidatures />} />
							<Route path="view" element={<ViewCandidature />} />
							<Route path="edit" element={<EditCandidature />} />
						</Route>

						{/* System Settings */}
						<Route path="/settings">
							<Route index element={<Settings />} />
						</Route>
          </Route>


					<Route path="/unauthorized" element = {<Unauthorized />} />
					<Route path="*" element ={<PageNotFound/>}></Route>

				</Routes>
			</div>
		</Router>

		</CompanyProvider>
	);

}

export default App;

// TODO : listas header filtrar / pesquisar na lista