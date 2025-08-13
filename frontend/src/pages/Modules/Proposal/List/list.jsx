import './list.css';
import { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { OptionButton, PrimaryButtonSmall, Alert, Pill, SecundaryButtonSmall } from '../../../../components';
import { useDebounce } from './../../../../helpers';
import { listProposals } from '../../../../services/proposals';
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
	const [status, setStatus] = useState(0);
	const [error, setError] = useState("");
	const [searchParams] = useSearchParams();

	const self_filter = searchParams.get("self") || false;

	const spanRef = useRef(null);
  const inputRef = useRef(null);
  const [inputWidth, setInputWidth] = useState(20);

	const [list, setList] = useState([]);

	useEffect(() => {
    const fetchProposals = async () => {
			const proposals = await listProposals(userInfo.token, setStatus, setError, self_filter);
			setList(proposals);
    };

    fetchProposals();
  }, []);


	const add = () => {
		navigate("/proposal/edit?new=true&create=true");
	}

	const [id, setId] = useState(null);
	const [title, setTitle] = useState(null);
	const [company, setCompany] = useState(null);
	const [course, setCourse] = useState(null);
	const [local, setLocal] = useState(null);
	const [calendar, setCalendar] = useState(null);

	const debouncedId = useDebounce(id, 300);
	const debouncedTitle = useDebounce(title, 300);
	const debouncedCompany = useDebounce(company, 300);
	const debouncedCourse = useDebounce(course, 300);
	const debouncedLocal = useDebounce(local, 300);
	const debouncedCalendar = useDebounce(calendar, 300);

	useEffect(() => {
		updateFilter('id', debouncedId);
		updateFilter('title', debouncedTitle);
		updateFilter('company', debouncedCompany);
		updateFilter('course', debouncedCourse);
		updateFilter('local', debouncedLocal);
		updateFilter('calendar', debouncedCalendar);
	}, [debouncedId, debouncedTitle, debouncedCompany, debouncedCourse, debouncedLocal, debouncedCalendar]);

	const [filters, setFilters] = useState({
		id: null,
		title: null,
		company: null,
		course: null,
		local: null,
		type: null,
		calendar: null,
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
				(filters.id === null || item.id.toString().includes(filters.id.toString())) &&
				(filters.title === null || item.title.toLowerCase().includes(filters.title.toLowerCase())) &&
				(filters.company === null || item.company.toLowerCase().includes(filters.company.toLowerCase())) &&
				(
					(filters.course === null || item.course.acronym.toLowerCase().includes(filters.course.toLowerCase())) ||
					(filters.course === null || item.course.name.toLowerCase().includes(filters.course.toLowerCase()))
				) &&
				(filters.local === null || item.local.toLowerCase().includes(filters.local.toLowerCase())) &&
				(filters.calendar === null || item.calendar.title.toLowerCase().includes(filters.calendar.toLowerCase())) &&
				(filters.type === null || item.type === filters.type)
			);
		});
	};

	useEffect(() => {
    if (spanRef.current) {
      const width = spanRef.current.offsetWidth;
      setInputWidth(width);
    }
  }, [id]);


	const Row = ({id, title, company, course, location, slots, taken, type, calendar, can_delete}) => {
		
		const view = () => {
			navigate("/proposal/view?id="+id);
		}
		const edit = () => {
			navigate("/proposal/edit?id="+id);
		}
		const handleDelete = () => {
			// TODO : eliminar Proposta
		}

		return(
			<tr className='table-row'>
				<th className='fit-column text-center'><p>{id}</p></th>
				<th><Pill type={type == 1 ? "Estágio" : "Projeto"} collapse={true} className='noselect' tooltip={type == 1 ? "Estágio" : "Projeto"} tooltipPosition='right' /></th>
				<th><p>{title}</p></th>
				<th><p>{company}</p></th>
				<th><p>{location}</p></th>
				<th><p>{calendar.title}</p></th>
				<th>
					<div className="tooltip tooltip-left">
						<p>{course.acronym}</p>
						<p className="tooltiptext">{course.name}</p>
					</div>
				</th>
				<th><p style={{textAlign: 'center'}}>{taken} / {slots}</p></th>
				<th>
					<div className='d-flex gap-2'>
						<OptionButton type='view' action={view} />
						{(role === "admin" || permissions["Propostas"].edit) && <OptionButton type='edit' action={edit} />}
						{((role === "admin" || permissions["Propostas"].delete) && can_delete) && <OptionButton type='delete' action={handleDelete} />}
					</div>
				</th>
			</tr>
		);
	}

	return(
		<div className='proposal-list d-flex flex-column'>

			<div className="top d-flex flex-row justify-content-between">
				<div className="title"><h4>Propostas</h4></div>

				<div className="filters"></div>

				<div className="options d-flex flex-row gap-3">
					<SecundaryButtonSmall content={<div className='d-flex flex-row gap-2'><i className="bi bi bi-download"></i><p>Exportar propostas</p></div>} />
					{(role === "admin" || permissions["Propostas"].edit) && <PrimaryButtonSmall action={add} content={<div className='d-flex flex-row gap-2'><i className="bi bi-plus-lg"></i><p>Adicionar proposta</p></div>} />}
				</div>
			</div>

			<div className="captions d-flex flex-row align-items-center gap-3">
				<div className="d-flex flex-row align-items-center gap-1"><Pill type={"Estágio"} collapse={true} className='noselect' /><p style={{color: "var(--teal)"}}>= Estágio</p></div>
				<p>|</p>
				<div className="d-flex flex-row align-items-center gap-1"><Pill type={"Projeto"} collapse={true} className='noselect' /><p style={{color: "var(--pink)"}}>= Projeto</p></div>
			</div>

			{list.length === 0 && <Alert text={role === "student" ? "As propostas ainda não estão disponíveis" : 'Não existe nenhuma proposta de momento'} />}

			{list.length > 0 && (
				<table>
					<tr className='header'>
						<th>
							<input
								type="number"
								value={id || ''}
								placeholder={'#'}
								onChange={(e) => setId(e.target.value === '' ? null : Number(e.target.value))}
								style={{ width: inputWidth, minWidth: 20, textAlign: 'center' }}
								ref={inputRef}
							/>
							<span
								ref={spanRef}
								style={{
									position: 'absolute',
									visibility: 'hidden',
									height: 0,
									overflow: 'scroll',
									whiteSpace: 'pre',
									fontSize: 'inherit',
									fontFamily: 'inherit',
									fontWeight: 'inherit',
									letterSpacing: 'inherit',
								}}
							>
								{id !== null && id !== undefined ? id : '#'}
							</span>
						</th>
						<th className='fit-column'>
							<p className='dropdown'>
								<select name="Tipo" id="type" onChange={(e) => updateFilter("type", e.target.value === "all" ? "all" : Number(e.target.value))}>
									<option value={"all"}>Tipo</option>
									<option value={1}>Estágio</option>
									<option value={2}>Projeto</option>
								</select>
							</p>
						</th>
						<th><p><input placeholder='Título' onChange={(e) => setTitle(e.target.value)}/></p></th>
						<th><p><input placeholder='Empresa' onChange={(e) => setCompany(e.target.value)}/></p></th>
						<th><p><input placeholder='Localização' onChange={(e) => setLocal(e.target.value)}/></p></th>
						<th><p><input placeholder='Calendário' onChange={(e) => setCalendar(e.target.value)}/></p></th>
						<th className='fit-column'><p><input placeholder='Curso' onChange={(e) => setCourse(e.target.value)}/></p></th>
						<th style={{width: 0}}><p>Vagas</p></th>
						<th className='fit-column'></th>
					</tr>

					{getFilteredList().map(proposal => (
						<Row key={proposal.id + "-" + proposal.type} {...proposal} />
					))}
					
				</table>
				
			)}

			{(getFilteredList().length === 0 && list?.length > 0) && <Alert text='Não foi encontrada nenhuma proposta' />}

		</div>
	);

}

export default List;