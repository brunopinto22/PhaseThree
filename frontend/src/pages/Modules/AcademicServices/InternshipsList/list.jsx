import './list.css';
import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert } from '../../../../components';
import { getStudentsWithInternships } from '../../../../services/students';
import { UserContext } from '../../../../contexts';

const InternshipsList = () => {
	const navigate = useNavigate();
	const { userInfo } = useContext(UserContext);
	const [status, setStatus] = useState(0);
	const [error, setError] = useState("");
	const [list, setList] = useState(null);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");

	useEffect(() => {
		const fetchStudents = async () => {
			setLoading(true);
			const students = await getStudentsWithInternships(userInfo.token, setStatus, setError);
			setList(students);
			setLoading(false);
		};

		if (userInfo?.token) {
			fetchStudents();
		}
	}, [userInfo]);

	useEffect(() => {
		if (status === 401) {
			navigate("/unauthorized");
		}
	}, [status, navigate]);

	if (loading) {
		return <div className="text-center mt-5"><p>Carregando...</p></div>;
	}

	if (error) {
		return <Alert text={error} />;
	}

	if (!list || list.length === 0) {
		return <Alert text="Nenhum estudante com internship encontrado" />;
	}

	// Filtrar lista com base no termo de pesquisa
	const filteredList = list.filter(student => {
		const search = searchTerm.toLowerCase();
		return (
			student.student_number.toString().includes(search) ||
			student.name.toLowerCase().includes(search) ||
			student.email.toLowerCase().includes(search) ||
			student.course.toLowerCase().includes(search) ||
			student.companies.some(c => c.company_name.toLowerCase().includes(search))
		);
	});

	return (
		<div className="internships-list-container">
			<h2>Estudantes com Internships</h2>
			
			<div className="search-bar mb-3">
				<input
					type="text"
					className="form-control"
					placeholder="Pesquisar por número, nome, email, curso ou empresa..."
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
				/>
				{searchTerm && (
					<small className="text-muted">
						{filteredList.length} resultado(s) de {list.length} total
					</small>
				)}
			</div>
			
			<div className="internships-table">
				<table className="table table-striped">
					<thead>
						<tr>
							<th>Número</th>
							<th>Nome</th>
							<th>Email</th>
							<th>Contacto</th>
							<th>Curso</th>
							<th>Empresas</th>
							<th>Orientadores</th>
							<th>Estado</th>
						</tr>
					</thead>
					<tbody>
						{filteredList.map((student, index) => (
							<tr key={index}>
								<td>{student.student_number}</td>
								<td>{student.name}</td>
								<td>{student.email}</td>
								<td>{student.contact || '-'}</td>
								<td>{student.course}</td>
								<td>
									<div className="companies-list">
										{student.companies && student.companies.length > 0 ? (
											student.companies.map((company, idx) => (
												<div key={idx} className="company-item">
													<strong>{company.company_name}</strong>
													<br />
													<small>Contact: {company.company_contact || '-'}</small>
													<br />
													<small>Email: {company.company_email || '-'}</small>
												</div>
											))
										) : '-'}
									</div>
								</td>
								<td>
									<div className="advisors-list">
										{student.advisors && student.advisors.length > 0 ? (
											student.advisors.map((advisor, idx) => (
												<div key={idx} className="advisor-item">
													<strong>{advisor.name}</strong>
													<br />
													<small>{advisor.email}</small>
													<br />
													<small>{advisor.contact || '-'}</small>
												</div>
											))
										) : '-'}
									</div>
								</td>
								<td>
									<div className="status-list">
										{student.internship_status && student.internship_status.map((status, idx) => (
											<span key={idx} className="badge bg-info">{status}</span>
										))}
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
};

export default InternshipsList;
