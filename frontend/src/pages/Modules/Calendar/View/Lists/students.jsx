import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { exportToCSV, useDebounce } from "../../../../../utils";
import { Alert, OptionButton, Pill, SecundaryButton } from "../../../../../components";
import { useNavigate } from "react-router-dom";

const Students = ({list, role}) => {
	const navigate = useNavigate();
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
				(filters.id === null || item.number.toString().includes(filters.id.toString())) &&
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

	useLayoutEffect(() => {
    const filteredList = getFilteredList();
    if (filteredList.length === 0 && spanRef.current) {
        const width = spanRef.current.offsetWidth;
        setInputWidth(width);
    }
		else if(filteredList.length > 0 && spanRef.current)
			setInputWidth(null)
  }, [debouncedId, name, email, course, acronym, list]);


	const Row = ({name, number, email, course, branch}) => {
		
		const view = () => {
			navigate("/student/view?id="+number);
		}
		const edit = () => {
			navigate("/student/edit?id="+number);
		}
		const handleDelete = () => {
			// TODO : eliminar Aluno
		}

		return(
			<tr className='table-row'>
				<th><p>{number}</p></th>
				<th><p>{name}</p></th>
				<th><p><a href={`mailto:`+ email}>{email}</a></p></th>
				<th><p>{course}</p></th>
				<th style={{width: 0}}>{branch ? <Pill text={branch.acronym} color={branch.color} tooltip={branch.name} tooltipPosition="left" /> : "—"}</th>
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


	return (
		<div className="list-container d-flex flex-column">
			{(list === null || list.length === 0) && <Alert text='Não existe nenhum aluno de momento' />}

			{list.length > 0 && <>

				<div className="captions d-flex flex-row justify-content-end align-items-center gap-3">
					<SecundaryButton disabled={getFilteredList() === 0} action={() => exportToCSV(getFilteredList(), "students")} small content={<div className='d-flex flex-row justify-content-center gap-2 w-100'><i className="bi bi-download"></i><p>Exportar alunos</p></div>} />
				</div>

			<table>
				<tr className='header'>
					<th className="fit-column">
						<input type="number" value={id || ''} placeholder={'Nº aluno'} onChange={e => setId(e.target.value === '' ? null : Number(e.target.value))}
							style={{
								width: inputWidth ? inputWidth : '',
								minWidth: spanRef?.current?.offsetWidth,
								textAlign: 'center'
							}} ref={inputRef}
						/>
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
					<th className="fit-column"></th>
				</tr>

				{getFilteredList().map(student => <Row key={student.number} {...student} />)}

			</table>
			</>}

			{list?.length > 0 && getFilteredList()?.length === 0 && <Alert text='Não foi encontrado nenhum aluno' />}

		</div>
	);

}

export default Students;