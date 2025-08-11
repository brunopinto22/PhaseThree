import './list.css';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OptionButton, PrimaryButtonSmall, SecundaryButtonSmall, Alert, Pill } from '../../../../components';
import { listStudents, useDebounce } from '../../../../helpers';

const List = () => {
	const navigate = useNavigate();

	const [status, setStatus] = useState(0);
	const [error, setError] = useState("");

	const [list, setList] = useState(null);
	useEffect(() => {
    const fetchStudents = async () => {
			const token = localStorage.getItem("access_token");
			const students = await listStudents(token, setStatus, setError);
			setList(students);
    };

    fetchStudents();
  }, []);

	useEffect(() => {
		if (status === 401) {
			navigate("/unauthorized");
		}
	}, [status, navigate]);

	const spanRef = useRef(null);
	const inputRef = useRef(null);
	const [inputWidth, setInputWidth] = useState();

	const [id, setId] = useState(null);
	const [name, setName] = useState(null);
	const [email, setEmail] = useState(null);
	const [course, setCourse] = useState(null);
	const [acronym, setAcronym] = useState(null);

	const debouncedId = useDebounce(id, 300);
	const debouncedName = useDebounce(name, 300);
	const debouncedEmail = useDebounce(email, 300);
	const debouncedCourse = useDebounce(course, 300);
	const debouncedAcronym = useDebounce(acronym, 300);

	useEffect(() => {
		updateFilter('id', debouncedId);
		updateFilter('name', debouncedName);
		updateFilter('email', debouncedEmail);
		updateFilter('course', debouncedCourse);
		updateFilter('acronym', debouncedAcronym);
	}, [debouncedId, debouncedName, debouncedEmail, debouncedCourse, debouncedAcronym]);

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
				(filters.id === null || item.student_number.toString().includes(filters.id.toString())) &&
				(filters.name === null || item.name.toLowerCase().includes(filters.name.toLowerCase())) &&
				(filters.email === null || item.email.toLowerCase().includes(filters.email.toLowerCase())) &&
				(filters.course === null || 
					item.course.toLowerCase().includes(filters.course.toLowerCase()) || 
					item.course_acronym.toLowerCase().includes(filters.course.toLowerCase())
				) &&
				(filters.acronym === null || item.branch.acronym.toLowerCase().includes(filters.acronym.toLowerCase()))
			);
		});
	};

	useEffect(() => {
    if (spanRef.current) {
      const width = spanRef.current.offsetWidth;
      setInputWidth(width);
    }
  }, [id]);


	const add = () => {
		navigate("/student/edit?new=true");
	}


	const Row = ({studentName, num, email, course, branch}) => {
		
		const view = () => {
			navigate("/student/view?id="+num);
		}
		const edit = () => {
			navigate("/student/edit?id="+num);
		}
		const handleDelete = () => {
			// TODO : eliminar Aluno
		}

		return(
			<tr className='table-row'>
				<th className='fit-column text-center'><p>{num}</p></th>
				<th><p>{studentName}</p></th>
				<th><p><a href={`mailto:`+ email}>{email}</a></p></th>
				<th><p>{course}</p></th>
				<th style={{width: 0}}>{branch ? <Pill text={branch.acronym} color={branch.color} /> : "—"}</th>
				<th>
					<div className='d-flex gap-2'>
						<OptionButton type='view' action={view} />
						<OptionButton type='edit' action={edit} />
						<OptionButton type='delete' action={handleDelete} />
					</div>
				</th>
			</tr>
		);
	}

	return(
		<div className='students-list d-flex flex-column'>

			<div className="top d-flex flex-row justify-content-between">
				<div className="title"><h4>Alunos</h4></div>

				<div className="filters"></div>

				<div className="options d-flex flex-row gap-3">
					<SecundaryButtonSmall content={<div className='d-flex flex-row gap-2'><i className="bi bi-cloud-upload"></i><p>Importar alunos</p></div>} />
					<PrimaryButtonSmall action={add} content={<div className='d-flex flex-row gap-2'><i className="bi bi-plus-lg"></i><p>Adicionar aluno</p></div>} />
				</div>
			</div>

			{(list === null || list.length === 0) && <Alert text='Não existe nenhum aluno de momento' />}

			{(list !== null && list.length > 0) && (
				<table>
					<tr className='header'>
						<th className='fit-column'>
							<input type="number" value={id || ''} placeholder={'Nº aluno'} onChange={e => setId(e.target.value === '' ? null : Number(e.target.value))} style={{
								width: inputWidth,
								minWidth: 20,
								textAlign: 'center'
							}} ref={inputRef} />
							<span ref={spanRef} style={{
								position: 'absolute',
								visibility: 'hidden',
								height: 0,
								overflow: 'scroll',
								whiteSpace: 'pre',
								fontSize: 'inherit',
								fontFamily: 'inherit',
								fontWeight: 'inherit',
								letterSpacing: 'inherit'
							}}>
								{id !== null && id !== undefined ? id : 'Nº aluno'}
							</span>
						</th>
						<th><p><input placeholder='Nome do Aluno' onChange={(e) => setName(e.target.value)}/></p></th>
						<th><p><input placeholder='Email' onChange={(e) => setEmail(e.target.value)}/></p></th>
						<th><p><input placeholder='Curso' onChange={(e) => setCourse(e.target.value)}/></p></th>
						<th><p><input style={{width:"100%", minWidth: "1vw"}}placeholder='Ramo' onChange={(e) => setAcronym(e.target.value)}/></p></th>
						<th className='fit-column'></th>
					</tr>

					{getFilteredList().map(student => (
						<Row key={student.student_number} studentName={student.name} num={student.student_number} email={student.email} course={student.course} branch={student.branch} />
					))}
					
				</table>
			)}
			{list?.length > 0 && getFilteredList()?.length === 0 && <Alert text='Não foi encontrado nenhum aluno' />}

		</div>
	);

}

export default List;