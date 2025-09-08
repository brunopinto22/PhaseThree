import { useEffect, useRef, useState } from "react";
import { useDebounce } from "../../../../../utils";
import { Alert, OptionButton, Pill, SecundaryButton, State } from "../../../../../components";
import { useNavigate } from "react-router-dom";
import { exportProposal } from "../../../../../services";

const Candidatures = ({list, placements, token, role}) => {
	const iconMap = [
		"bi-arrow-clockwise",
		"bi-check2",
		"bi-file-binary",
		"bi-journal-bookmark-fill",
		"bi-building-check",
		"bi-journal-check",
		"bi-rocket-fill",
	];
		
	const text = [
		"Pendente",
		"Colocado",
		"Protocolo Gerado",
		"Protocolo ISEC",
		"Protocolo Empresa",
		"Protocolo Aluno",
		"Em estágio",
	]

	const btnClass = [
		"pending",
		"accpeted",
		"protocol-generated",
		"protocol-isec",
		"protocol-company",
		"protocol-student",
		"start",
	];

	const navigate = useNavigate();
	const spanRef = useRef(null);
	const inputRef = useRef(null);
	const [inputWidth, setInputWidth] = useState(20);

	const [id, setId] = useState(null);
	const [student, setStudent] = useState(null);
	const [company, setCompany] = useState(null);
	const [state, setState] = useState(null);
	const [title, setTitle] = useState(null);

	const debouncedId = useDebounce(id, 300);
	const debouncedStudent = useDebounce(student, 300);
	const debouncedCompany = useDebounce(company, 300);
	const debouncedTitle = useDebounce(title, 300);
	
	useEffect(() => {
		updateFilter('number', debouncedId);
		updateFilter('student', debouncedStudent);
		updateFilter('company', debouncedCompany);
		updateFilter('title', debouncedTitle);
	}, [debouncedId, debouncedStudent, debouncedCompany, debouncedTitle]);

	const [filters, setFilters] = useState({
		state: null,
		number: null,
		student: null,
		company: null,
		title: null,
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
				(filters.number === null || item.student.number.toString().includes(filters.number.toString())) &&
				(filters.student === null || item.student.name.toLowerCase().includes(filters.student.toLowerCase())) &&
				(filters.title === null || item.proposal.title.toLowerCase().includes(filters.title.toLowerCase())) &&
				(filters.company === null || item.proposal.company.name.toLowerCase().includes(filters.company.toLowerCase())) &&
				(filters.state === null || item.state === filters.state)
			);
		});
	};

	useEffect(() => {
    if (spanRef.current) {
      const width = spanRef.current.offsetWidth;
      setInputWidth(width);
    }
  }, [id]);



	const Row = ({id, state, student, proposal}) => {
	
		const view = () => {
			navigate("/candidature/view?id="+id);
		}
		const edit = () => {
			navigate("/candidature/edit?id="+id);
		}
		const handleDelete = () => {
			// TODO : eliminar Proposta
		}

		return(
			<tr className='table-row'>
				<th><State state={state} hideState={true} hideText={true} tooltip={true} /></th>
				<th className='fit-column text-center'><p>{student.number}</p></th>
				<th><p>{student.name}</p></th>
				<th><p>{state > 1 ? (proposal.company.name) : '—'}</p></th>
				<th><p>{state > 1 ? (proposal.title) : '—'}</p></th>
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
					{iconMap.map((icon,index) => (
						<><div className={`cap noselect d-flex flex-row align-items-center gap-2 ${btnClass[index]}`}><i className={`bi ${icon}`}></i><p>{text[index]}</p></div>{index < iconMap.length-1 && (<p>|</p>)}</>
					))}
				</div>

				<div className="d-flex flex-row align-items-center gap-3">
					<SecundaryButton small content={<div className='d-flex flex-row justify-content-center gap-2 w-100'><i className="bi bi-download"></i><p>Exportar colocações</p></div>} disabled={!placements || new Date() < new Date(placements)} />
				</div>
			</div>
			
			<table>
				<tr className='header'>
					<th className="fit-column" style={{minWidth: 120}}>
						<p className='dropdown'>
							<select name="Estado" id="type" onChange={e => updateFilter("state", e.target.value === "all" ? "all" : Number(e.target.value))}>
								<option value={"all"}>Estado</option>
								{text.map((t, index) => (
									<option key={index + "_" + text} value={index+1}>{t}</option>
								))}
							</select>
						</p>
					</th>
					<th>
						<input type="number" value={id || ''} placeholder={'Nº aluno'} onChange={e => setId(e.target.value === '' ? null : Number(e.target.value))} style={{
							width: inputWidth,
							minWidth: 80,
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
					<th><p><input placeholder='Aluno' onChange={e => setStudent(e.target.value)} /></p></th>
					<th><p><input placeholder='Empresa' onChange={e => setCompany(e.target.value)} /></p></th>
					<th><p><input placeholder='Proposta' onChange={e => setTitle(e.target.value)} /></p></th>
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

export default Candidatures;