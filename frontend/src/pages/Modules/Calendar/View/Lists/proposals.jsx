import { useEffect, useRef, useState } from "react";
import { useDebounce } from "../../../../../utils";
import { Alert, OptionButton, Pill, SecundaryButtonSmall } from "../../../../../components";
import { useNavigate } from "react-router-dom";
import { exportProposal } from "../../../../../services";

const Proposals = ({list, placements, token, calendar_id}) => {
	const navigate = useNavigate();
	const spanRef = useRef(null);
	const inputRef = useRef(null);
	const [inputWidth, setInputWidth] = useState(20);

	const [id, setId] = useState(null);
	const [title, setTitle] = useState(null);
	const [company, setCompany] = useState(null);
	const [course, setCourse] = useState(null);
	const [local, setLocal] = useState(null);

	const debouncedId = useDebounce(id, 300);
	const debouncedTitle = useDebounce(title, 300);
	const debouncedCompany = useDebounce(company, 300);
	const debouncedCourse = useDebounce(course, 300);
	const debouncedLocal = useDebounce(local, 300);

	useEffect(() => {
		updateFilter('id', debouncedId);
		updateFilter('title', debouncedTitle);
		updateFilter('company', debouncedCompany);
		updateFilter('course', debouncedCourse);
		updateFilter('local', debouncedLocal);
	}, [debouncedId, debouncedTitle, debouncedCompany, debouncedCourse, debouncedLocal]);

	const [filters, setFilters] = useState({
		id: null,
		title: null,
		company: null,
		course: null,
		local: null,
		type: null,
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
				(filters.title === null || item.title.toLowerCase().includes(filters.title.toLowerCase())) &&
				(filters.company === null || item.company.name.toLowerCase().includes(filters.company.toLowerCase())) &&
				(filters.course === null || item.course.name.toLowerCase().includes(filters.course.toLowerCase())) &&
				(filters.local === null || item.location.toLowerCase().includes(filters.local.toLowerCase())) &&
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



	const Row = ({id, proposal_number, title, company, course, location, slots, taken, type}) => {
	
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
				<th className="fit-column text-center"><p>{proposal_number}</p></th>
				<th><Pill type={type == 1 ? "Estágio" : "Projeto"} collapse={true} className='noselect' tooltip={type == 1 ? "Estágio" : "Projeto"} tooltipPosition="right" /></th>
				<th className="overflow-column"><p>{title}</p></th>
				<th><p>{company.name}</p></th>
				<th><p>{course.name}</p></th>
				<th><p>{location}</p></th>
				<th><p style={{textAlign: 'center'}}>{taken} / {slots}</p></th>
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
		<div className="list-container list-container d-flex flex-column">
		
			{list.length === 0 && <Alert text='Não existe nenhuma proposta de momento' />}

			{list.length > 0 &&
			<>
			<div className="d-flex flex-row align-items-center justify-content-between">

				<div className="captions d-flex flex-row align-items-center gap-3">
					<div className="d-flex flex-row align-items-center gap-1"><Pill type={"Estágio"} collapse={true} className='noselect' /><p style={{color: "var(--teal)"}}>= Estágio</p></div>
					<p>|</p>
					<div className="d-flex flex-row align-items-center gap-1"><Pill type={"Projeto"} collapse={true} className='noselect' /><p style={{color: "var(--pink)"}}>= Projeto</p></div>
				</div>

				<div className="d-flex flex-row align-items-center gap-3">
					<SecundaryButtonSmall action={() => exportProposal(token, id, null, null, null, false)} content={<div className='d-flex flex-row justify-content-center gap-2 w-100'><i className="bi bi-download"></i><p>Exportar propostas</p></div>} />
					<SecundaryButtonSmall content={<div className='d-flex flex-row justify-content-center gap-2 w-100'><i className="bi bi-download"></i><p>Exportar colocações</p></div>} disabled={!placements || new Date() < new Date(placements)} />
				</div>
			</div>
			
			<table>
				<tr className='header'>
					<th>
						<input type="number" value={id || ''} placeholder={'#'} onChange={e => setId(e.target.value === '' ? null : Number(e.target.value))} style={{
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
							{id !== null && id !== undefined ? id : '#'}
						</span>
					</th>
					<th className="fit-column">
						<p className='dropdown'>
							<select name="Tipo" id="type" onChange={e => updateFilter("type", e.target.value === "all" ? "all" : Number(e.target.value))}>
								<option value={"all"}>Tipo</option>
								<option value={1}>Estágio</option>
								<option value={2}>Projeto</option>
							</select>
						</p>
					</th>
					<th className="overflow-column"><p><input placeholder='Título' onChange={e => setTitle(e.target.value)} /></p></th>
					<th><p><input placeholder='Empresa' onChange={e => setCompany(e.target.value)} /></p></th>
					<th><p><input placeholder='Curso' onChange={e => setCourse(e.target.value)} /></p></th>
					<th><p><input placeholder='Localização' onChange={e => setLocal(e.target.value)} /></p></th>
					<th style={{width: 0}}><p>Vagas</p></th>
					<th className="fit-column"></th>
				</tr>

				{getFilteredList().map(proposal => <Row key={proposal.id + "-" + proposal.type} {...proposal} />)}

			</table>
			</>
			}

			{(getFilteredList().length === 0 && list.length > 0) && <Alert text='Não foi encontrada nenhuma proposta' />}

		</div>
	);

}

export default Proposals;