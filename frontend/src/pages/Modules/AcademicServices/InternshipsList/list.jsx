import './list.css';
import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, SecundaryButton } from '../../../../components';
import { getStudentsWithInternships } from '../../../../services/students';
import { listCalendars } from '../../../../services/calendars';
import { UserContext } from '../../../../contexts';

const InternshipsList = () => {
	const navigate = useNavigate();
	const { userInfo } = useContext(UserContext);
	const [status, setStatus] = useState(0);
	const [error, setError] = useState("");
	const [list, setList] = useState(null);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [calendars, setCalendars] = useState([]);
	const [selectedCalendar, setSelectedCalendar] = useState("");
	const [sortColumn, setSortColumn] = useState(null);
	const [sortDirection, setSortDirection] = useState('asc');

	// Mapa de ícones para estados de internships
	const stateIconMap = {
		'placed': 'bi-check2',
		'accepted': 'bi-clipboard-check',
		'rejected': 'bi-clipboard-x',
		'protocol_generated': 'bi-file-binary',
		'presidency_signature': 'bi-journal-bookmark-fill',
		'company_signature': 'bi-building-check',
		'student_signature': 'bi-journal-check',
		'in_internship': 'bi-rocket-fill',
		'finished': 'bi-flag-fill',
	};

	const stateColorMap = {
		'placed': 'placed',
		'accepted': 'accepted',
		'rejected': 'rejected',
		'protocol_generated': 'protocol-generated',
		'presidency_signature': 'protocol-isec',
		'company_signature': 'protocol-company',
		'student_signature': 'protocol-student',
		'in_internship': 'in-internship',
		'finished': 'finished',
	};

	const stateTextMap = {
		'placed': 'Colocado',
		'accepted': 'Aceite',
		'rejected': 'Rejeitado',
		'protocol_generated': 'Protocolo Gerado',
		'presidency_signature': 'Protocolo ISEC',
		'company_signature': 'Protocolo Empresa',
		'student_signature': 'Protocolo Aluno',
		'in_internship': 'Em estágio',
		'finished': 'Finalizado',
	};

	// Carregar calendários ao montar o componente
	useEffect(() => {
		const fetchCalendars = async () => {
			const cals = await listCalendars(userInfo.token, setStatus, setError);
			if (cals) {
				setCalendars(cals);
			}
		};

		if (userInfo?.token) {
			fetchCalendars();
		}
	}, [userInfo]);

	// Carregar estudantes (filtrados ou não)
	useEffect(() => {
		const fetchStudents = async () => {
			setLoading(true);
			const students = await getStudentsWithInternships(
				userInfo.token,
				setStatus,
				setError,
				selectedCalendar || null
			);
			setList(students);
			setLoading(false);
		};

		if (userInfo?.token) {
			fetchStudents();
		}
	}, [userInfo, selectedCalendar]);

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

	// Handler para ordenação
	const handleSort = (column) => {
		if (sortColumn === column) {
			// Se já está ordenado por esta coluna, inverte a direção
			setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
		} else {
			// Nova coluna, começa com ascendente
			setSortColumn(column);
			setSortDirection('asc');
		}
	};

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

	// Ordenar lista filtrada
	const sortedList = [...filteredList].sort((a, b) => {
		if (!sortColumn) return 0;

		let aValue, bValue;

		switch (sortColumn) {
			case 'number':
				aValue = a.student_number;
				bValue = b.student_number;
				break;
			case 'name':
				aValue = a.name.toLowerCase();
				bValue = b.name.toLowerCase();
				break;
			case 'email':
				aValue = a.email.toLowerCase();
				bValue = b.email.toLowerCase();
				break;
			case 'contact':
				aValue = a.contact || '';
				bValue = b.contact || '';
				break;
			case 'course':
				aValue = a.course.toLowerCase();
				bValue = b.course.toLowerCase();
				break;
			case 'status':
				// Ordena pelo primeiro estado ou string vazia
				aValue = (a.internship_status && a.internship_status[0]) ? a.internship_status[0].toLowerCase() : '';
				bValue = (b.internship_status && b.internship_status[0]) ? b.internship_status[0].toLowerCase() : '';
				break;
			default:
				return 0;
		}

		if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
		if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
		return 0;
	});

	return (
		<div className="internships-list d-flex flex-column">

			<div className="top d-flex flex-row justify-content-between">
				<div className="title"><h4>Estudantes com Internships</h4></div>

				<div className="filters"></div>

				<div className="options d-flex gap-3">
					{/* Opções podem ser adicionadas aqui */}
				</div>
			</div>

			<div className="captions noselect d-flex flex-wrap gap-2">
				{Object.entries(stateTextMap).map(([state, text], index) => (
					<div key={state} className={`cap d-flex flex-row align-items-center gap-2 ${stateColorMap[state]}`}>
						<i className={`bi ${stateIconMap[state]}`}></i>
						<p>{text}</p>
					</div>
				))}
			</div>

			<div className="filters-section mb-3">
				<div className="row">
					<div className="col-md-4 mb-2">
						<label htmlFor="calendar-filter" className="form-label">Filtrar por Calendário:</label>
						<select
							id="calendar-filter"
							className="form-select"
							value={selectedCalendar}
							onChange={(e) => setSelectedCalendar(e.target.value)}
						>
							<option value="">Todos os calendários</option>
							{calendars.map((cal) => (
								<option key={cal.id} value={cal.id}>
									{cal.title} - {cal.course_name}
								</option>
							))}
						</select>
					</div>
					<div className="col-md-8">
						<label htmlFor="search-input" className="form-label">Pesquisar:</label>
						<input
							id="search-input"
							type="text"
							className="form-control"
							placeholder="Pesquisar por número, nome, email, curso ou empresa..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
						{searchTerm && (
							<small className="text-muted">
								{sortedList.length} resultado(s) de {list.length} total
							</small>
						)}
					</div>
				</div>
			</div>


			{!list || list.length === 0 && <Alert text="Nenhum estudante com internship encontrado" />}

			{list && list.length > 0 && (
				<div className="table-container shadow-sm">
					<table>
						<thead>
							<tr className='header'>
								<th style={{ cursor: 'pointer' }} onClick={() => handleSort('number')} className='fit-column'>
									<p>Nº aluno {sortColumn === 'number' && (sortDirection === 'asc' ? '↑' : '↓')}</p>
								</th>
								<th style={{ cursor: 'pointer' }} onClick={() => handleSort('name')}>
									<p>Aluno {sortColumn === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}</p>
								</th>
								<th style={{ cursor: 'pointer' }} onClick={() => handleSort('email')}>
									<p>Email {sortColumn === 'email' && (sortDirection === 'asc' ? '↑' : '↓')}</p>
								</th>
								<th style={{ cursor: 'pointer' }} onClick={() => handleSort('contact')}>
									<p>Contacto {sortColumn === 'contact' && (sortDirection === 'asc' ? '↑' : '↓')}</p>
								</th>
								<th><p>Empresas</p></th>
								<th><p>Orientadores</p></th>
								<th style={{ cursor: 'pointer' }} onClick={() => handleSort('status')} className='fit-column'>
									<p>Estado {sortColumn === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}</p>
								</th>
							</tr>
						</thead>

						<tbody>
							{sortedList.map((student, index) => (
								<tr key={index} className='table-row'>
									<th className='fit-column text-center'><p>{student.student_number}</p></th>
									<th><p>{student.name}</p></th>
									<th><p>{student.email}</p></th>
									<th><p>{student.contact || '—'}</p></th>
									<th>
										<div className="companies-list">
											{student.companies && student.companies.length > 0 ? (
												student.companies.map((company, idx) => (
													<div key={idx} className="company-item">
														<strong>{company.company_name}</strong>
														<br />
														<span>Contacto: {company.company_contact || '-'}</span>
														<br />
														<span>Email: {company.company_email || '-'}</span>
													</div>
												))
											) : '—'}
										</div>
									</th>
									<th>
										<div className="advisors-list">
											{student.advisors && student.advisors.length > 0 ? (
												student.advisors.map((advisor, idx) => (
													<div key={idx} className="advisor-item">
														<strong>{advisor.name}</strong>
														<br />
														<span>Contacto: {advisor.contact || '-'}</span>
														<br />
														<small>Email: {advisor.email}</small>
													</div>
												))
											) : '—'}
										</div>
									</th>
									<th className='fit-column'>
										<div className="status-list d-flex gap-2 flex-row">
											{student.internship_status && student.internship_status.map((status, idx) => {
												const icon = stateIconMap[status] || 'bi-question-circle';
												const colorClass = stateColorMap[status] || '';
												return (
													<div key={idx} className={`cap noselect d-flex flex-row align-items-center gap-1 ${colorClass}`} style={{ fontSize: '0.8em' }}>
														<i className={`bi ${icon}`}></i>
													</div>
												);
											})}
										</div>
									</th>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

		</div>
	);
};

export default InternshipsList;
