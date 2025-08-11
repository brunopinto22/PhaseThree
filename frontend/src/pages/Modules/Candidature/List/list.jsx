import './list.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OptionButton, SecundaryButtonSmall, Alert, State } from '../../../../components';

const List = () => {

	const navigate = useNavigate();

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

	const [list, setList] = useState([
		{
      id: 1,
      studentName: "João Silva",
      studentNumber: 2020123456,
			companyName: "TekFusion",
      proposalName: "Desenvolvimento de aplicações web",
			state: 1,
    },
		{
      id: 2,
      studentName: "João Silva",
      studentNumber: 2020123456,
			companyName: "TekFusion",
      proposalName: "Desenvolvimento de aplicações web",
			state: 2,
    },
		{
      id: 3,
      studentName: "João Silva",
      studentNumber: 2020123456,
			companyName: "TekFusion",
      proposalName: "Desenvolvimento de aplicações web",
			state: 3,
    },
		{
      id: 4,
      studentName: "João Silva",
      studentNumber: 2020123456,
			companyName: "TekFusion",
      proposalName: "Desenvolvimento de aplicações web",
			state: 4,
    },
		{
      id: 5,
      studentName: "João Silva",
      studentNumber: 2020123456,
			companyName: "TekFusion",
      proposalName: "Desenvolvimento de aplicações web",
			state: 5,
    },
		{
      id: 6,
      studentName: "João Silva",
      studentNumber: 2020123456,
			companyName: "TekFusion",
      proposalName: "Desenvolvimento de aplicações web",
			state: 6,
    },
		{
      id: 7,
      studentName: "João Silva",
      studentNumber: 2020123456,
			companyName: "TekFusion",
      proposalName: "Desenvolvimento de aplicações web",
			state: 7,
    },
  ]);
	// TODO : pedir lista de Candidaturas	


	const exportList = () => {
	}


	const Row = ({id, studentName, studentNumber, companyName, proposalName, state}) => {
		
		const view = () => {
			navigate("/candidature/view?id="+id);
		}
		const edit = () => {
			navigate("/candidature/edit?id="+id);
		}
		const handleDelete = () => {
			// TODO : eliminar Candidatura
		}

		return(
			<tr className='table-row'>
				<th><State state={state} hideState={true} hideText={true} /></th>
				<th className='fit-column text-center'><p>{studentNumber}</p></th>
				<th><p>{studentName}</p></th>
				<th><p>{state > 1 ? (companyName) : '—'}</p></th>
				<th><p>{state > 1 ? (proposalName) : '—'}</p></th>
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
		<div className='candidatures-list d-flex flex-column'>

			<div className="top d-flex flex-row justify-content-between">
				<div className="title"><h4>Candidaturas</h4></div>

				<div className="filters"></div>

				<div className="options d-flex gap-3">
					<SecundaryButtonSmall action={exportList} content={<div className='d-flex flex-row gap-2'><i className="bi bi-download"></i><p>Exportar colocações</p></div>} />
				</div>
			</div>

			<div className="captions d-flex flex-row align-items-center gap-3">
				{iconMap.map((icon,index) => (
					<><div className={`cap noselect d-flex flex-row align-items-center gap-2 ${btnClass[index]}`}><i className={`bi ${icon}`}></i><p>{text[index]}</p></div>{index < iconMap.length-1 && (<p>|</p>)}</>
				))}
			</div>

			{list.length === 0 && <Alert text='Não existe nenhum docente de momento' />}

			{list.length > 0 && (
				<table>
					<tr className='header'>
						<th className='fit-column'><p>Estado</p></th>
						<th className='fit-column'><p>Nº aluno</p></th>
						<th><p>Aluno</p></th>
						<th><p>Empresa/Docente</p></th>
						<th><p>Proposta</p></th>
						<th className='fit-column'></th>
					</tr>

					{list.map(candidature => (
						<Row key={candidature.id} {...candidature} />
					))}
					
				</table>
			)}

		</div>
	);

}

export default List;