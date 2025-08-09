import './list.css';
import { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, OptionButton, PrimaryButtonSmall } from '../../../../components';
import { deleteCourse, listCourses } from '../../../../helpers/courses';
import { useDebounce } from '../../../../helpers';
import { UserContext } from '../../../../contexts';

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

	const [reload, setReload] = useState(false);
	const [list, setList] = useState([]);
	const [status, setStatus] = useState([]);
	const [error, setError] = useState([]);
	
	useEffect(() => {
    const fetchCourses = async () => {
			const token = localStorage.getItem("access_token");
			const courses = await listCourses(token, setStatus, setError);
			setList(courses);
    };

    fetchCourses();
  }, [reload]);

	useEffect(() => {
		if (status === 401) {
			navigate("/unauthorized");
		}
	}, [status, navigate]);

	const add = () => {
		navigate("/course/edit?new=true");
	}

	const spanRef = useRef(null);
	const inputRef = useRef(null);
	const [inputWidth, setInputWidth] = useState(20);
	const [id, setId] = useState(null);
	const [name, setName] = useState(null);
	const [acronym, setAcronym] = useState(null);
	const [email, setEmail] = useState(null);

	const debouncedId = useDebounce(id, 300);
	const debouncedName = useDebounce(name, 300);
	const debouncedAcronym = useDebounce(acronym, 300);
	const debouncedEmail = useDebounce(email, 300);

	useEffect(() => {
		updateFilter('id', debouncedId);
		updateFilter('name', debouncedName);
		updateFilter('acronym', debouncedAcronym);
		updateFilter('email', debouncedEmail);
	}, [debouncedId, debouncedName, debouncedAcronym, debouncedEmail]);

	const [filters, setFilters] = useState({
		id: null,
		name: null,
		acronym: null,
		email: null,
	});
	const updateFilter = (key, value) => {
		setFilters(prev => ({
			...prev,
			[key]: value === 'all' ? null : value
		}));
	};
	const getFilteredList = () => {
		return list.filter((item) => {
			return (
				(filters.id === null || item.id === filters.id) &&
				(filters.name === null || item.name.toLowerCase().includes(filters.name.toLowerCase())) &&
				(filters.acronym === null || item.acronym.toLowerCase().includes(filters.acronym.toLowerCase())) &&
				(filters.email === null || item.email.toLowerCase().includes(filters.email.toLowerCase()))
			);
		});
	};

	useEffect(() => {
		if (spanRef.current) {
			const width = spanRef.current.offsetWidth;
			setInputWidth(width);
		}
	}, [id]);


	const Row = ({id, name, acronym, email, branches}) => {
		
		const view = () => {
			navigate("/course/view?id="+id);
		}
		const edit = () => {
			navigate("/course/edit?id="+id);
		}
		const handleDelete = async () => {
			await deleteCourse(localStorage.getItem("access_token"), Number(id));
			setReload(prev => !prev);
		};

		return(
			<tr className='table-row'>
				<th className='text-center'><p>{acronym}</p></th>
				<th><p>{name}</p></th>
				<th><p><a href={`mailto:`+ email}>{email}</a></p></th>
				<th className='text-center'><p>{branches}</p></th>
				<th>
					<div className='d-flex gap-2'>
						<OptionButton type='view' action={view} />
						{(permissions['Cursos'].edit || role === "admin") && <OptionButton type='edit' action={edit} />}
						{(permissions['Cursos'].delete || role === "admin") && <OptionButton type='delete' action={handleDelete} />}
					</div>
				</th>
			</tr>
		);
	}

	return(
		<div className='courses-list d-flex flex-column'>

			<div className="top d-flex flex-row justify-content-between">
				<div className="title"><h4>Cursos</h4></div>

				<div className="filters"></div>

				<div className="options d-flex gap-3">
					{(role === "admin" || permissions["Cursos"].edit) && <PrimaryButtonSmall action={add} content={<div className='d-flex flex-row gap-2'><i className="bi bi-plus-lg"></i><p>Adicionar curso</p></div>} />}
				</div>
			</div>

			{list.length === 0 && <Alert text='Não existe nenhum curso de momento' />}

			{list.length > 0 && (
				<table>
					<tr className='header'>
						<th className='fit-column text-center'><p><input placeholder='Sigla' onChange={(e) => setAcronym(e.target.value)}/></p></th>
						<th><p><input placeholder='Nome do Curso' onChange={(e) => setName(e.target.value)}/></p></th>
						<th><p><input placeholder='Email' onChange={(e) => setEmail(e.target.value)}/></p></th>
						<th className='fit-column text-center'><p>Ramos</p></th>
						<th className='fit-column'></th>
					</tr>

					{getFilteredList().map(course => (
						<Row key={course.id} id={course.id} name={course.name} acronym={course.acronym} email={course.email} branches={course.num_branches} />
					))}
				</table>
			)}
			{list.length > 0 && getFilteredList().length === 0 && <Alert text='Não foi encontrado nenhum curso' />}

		</div>
	);

}

export default List;