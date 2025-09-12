import './list.css';
import { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { OptionButton, PrimaryButton, Alert, CheckBox } from '../../../../components';
import { deleteTeacher, listTeachers } from '../../../../services';
import { useDebounce } from '../../../../utils';
import { UserContext } from './../../../../contexts';

const List = () => {

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

    if (permissions["Docentes"].view === false && role !== "admin") {
      navigate("/unauthorized");
    }
  }, [userInfo, permissions, role, navigate]);

	const [reload, setReload] = useState(false);
	const [list, setList] = useState([]);
	const [status, setStatus] = useState([]);
	const [error, setError] = useState([]);
	
	useEffect(() => {
    const fetchTeachers = async () => {
			const token = localStorage.getItem("access_token");
			const teachers = await listTeachers(token, setStatus, setError);
			setList(teachers);
    };

    fetchTeachers();
  }, [reload]);

	useEffect(() => {
		if (status === 401) {
			navigate("/unauthorized");
		}
	}, [status, navigate]);


	const spanRef = useRef(null);
	const [name, setName] = useState(null);
	const [email, setEmail] = useState(null);
	const [area, setArea] = useState(null);

	const debouncedName = useDebounce(name, 300);
	const debouncedEmail = useDebounce(email, 300);
	const debouncedArea = useDebounce(area, 300);

	useEffect(() => {
		updateFilter('name', debouncedName);
		updateFilter('email', debouncedEmail);
		updateFilter('area', debouncedArea);
	}, [debouncedName, debouncedEmail, debouncedArea]);

	const [filters, setFilters] = useState({
		active: false,
		name: null,
		email: null,
		area: null,
	});
	const updateFilter = (key, value) => {
		setFilters(prev => ({
			...prev,
			[key]: value === 'all' ? null : value
		}));
	};
	const getFilteredList = () => {
		return list.filter((item) => {
			if (filters.active === false && !item.active) return false;
			
			return (
				(filters.name === null || item.teacher_name.toLowerCase().includes(filters.name.toLowerCase())) &&
				(filters.email === null || item.teacher_email.toLowerCase().includes(filters.email.toLowerCase())) &&
				(filters.area === null || item.scientific_area_name.toLowerCase().includes(filters.area.toLowerCase()))
			);
		});
	};


	const add = () => {
		navigate("/teacher/edit?new=true");
	}


	const Row = ({active, id, name, email, area}) => {
		
		const view = () => {
			navigate("/teacher/view?id="+id);
		}
		const edit = () => {
			navigate("/teacher/edit?id="+id);
		}
		const handleDelete = async () => {
			await deleteTeacher(localStorage.getItem("access_token"), Number(id));
			setReload(prev => !prev);
		}

		return(
			<tr className={`table-row ${active ? "" : "disabled"}`}>
				<th><p>{name}</p></th>
				<th><p><a href={`mailto:`+ email}>{email}</a></p></th>
				<th style={{width: 0}}><p>{area}</p></th>
				<th>
					<div className='d-flex gap-2'>
						{(permissions['Docentes'].view || role === "admin") && <OptionButton type='view' action={view} />}
						{(permissions['Docentes'].edit || role === "admin") && <OptionButton type='edit' action={edit} />}
						{(permissions['Docentes'].delete || role === "admin") && <OptionButton type='delete' action={handleDelete} />}
					</div>
				</th>
			</tr>
		);
	}

	return(
		<div className='teachers-list d-flex flex-column'>

			<div className="top d-flex flex-row justify-content-between">
				<div className="title"><h4>Docentes</h4></div>
			</div>

			<div className="d-flex flex-row justify-content-between align-items-end">
				<div className="filters">
					<CheckBox label={<p>Inativos</p>} value={filters.active} setValue={(e) => updateFilter("active", e)} />
				</div>

				<div className="options d-flex gap-3 m-0 p-0">
					<PrimaryButton small action={add} content={<div className='d-flex flex-row gap-2'><i className="bi bi-plus-lg"></i><p>Adicionar docente</p></div>} />
				</div>
			</div>

			{list.length === 0 && <Alert text='Não existe nenhum docente de momento' />}

			{list.length > 0 && (
				<table>
					<tr className='header'>
						<th><p><input placeholder='Nome do Docente' onChange={(e) => setName(e.target.value)}/></p></th>
						<th><p><input placeholder='Email' onChange={(e) => setEmail(e.target.value)}/></p></th>
						<th><p><input placeholder='Área científica' onChange={(e) => setArea(e.target.value)}/></p></th>
						<th className='fit-column'></th>
					</tr>

					{getFilteredList().map(t => (
						<Row key={t.id_teacher} active={t.active} id={t.id_teacher} name={t.teacher_name} email={t.teacher_email} area={t.scientific_area_name} />
					))}
					
				</table>
			)}

			{list?.length > 0 && getFilteredList().length === 0 && <Alert text='Não foi encontrado nenhuma Docente' />}

		</div>
	);

}

export default List;