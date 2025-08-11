import './edit.css';
import default_pfp from './../../../../assets/imgs/default_pfp.jpg';

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearchParams } from "react-router-dom";
import { PrimaryButton, PrimaryButtonSmall, SecundaryButton, TextInput, Dropdown, CheckBox, Alert, OptionButton } from '../../../../components';

const Edit = () =>  {

	const navigate = useNavigate();
	const [searchParams] = useSearchParams();

	const id = searchParams.get("id");
  const isNew = searchParams.get("new");
	
	const [state, setState] = useState(null);
	const [list, setList] = useState([
		{
			id: 1,
			companyName: "TekFusion",
      proposalName: "Desenvolvimento de aplicações web",
			state: 1,
		},
		{
			id: 2,
			companyName: "TekFusion",
      proposalName: "Desenvolvimento de aplicações web",
			state: 2,
		},
		{
			id: 3,
			companyName: "TekFusion",
      proposalName: "Desenvolvimento de aplicações web",
			state: 3,
		},
	]);

	const [perms, setPerms] = useState({
		Calendars: { view: true, edit: false, delete: false },
		Course: { view: true, edit: false, delete: false },
		Students: { view: true, edit: false, delete: false },
		Teachers: { view: true, edit: false, delete: false },
		Companies: { view: true, edit: false, delete: false },
		Proposals: { view: true, edit: false, delete: false },
		Candidatures: { view: true, edit: false, delete: false },
	});

	// TODO : verificar se é o Admin~
	const canEdit = true;

	if(isNew == null || !isNew) {
		// TODO : pedir info API
	}


	const submit = () => {
			// TODO : submit editar
	}
	
	const cancel = () => {
		if (window.history.length > 2)
			navigate(-1);
		else
			navigate('/');
	}


	const Row = ({id, companyName, proposalName, state}) => {
		
		const view = () => {
			navigate("/proposal/view?id="+id);
		}
		const edit = () => {
			// TODO : mudar estado
		}
		const handleDelete = () => {
			// TODO : remover Proposta da Candidatura
		}

		return(
			<tr className='table-row'>
				<th><p>{id}</p></th>
				<th><p>{proposalName}</p></th>
				<th><p>{companyName}</p></th>
				<th>
					<Dropdown text=''>
						<option>Pendente</option>
						<option>Colocado</option>
						<option>Rejeitado</option>
					</Dropdown>
				</th>
				<th>
					<div className='d-flex gap-2'>
						<OptionButton type='view' action={view} />
						<OptionButton type='remove' action={handleDelete} />
					</div>
				</th>
			</tr>
		);
	}


	return(
		<div id='candidature' className='d-flex flex-column'>

			<section className='row p-0'>
				<h4>Editar Candidatura</h4>
				<div className='d-flex flex-column gap-3'>
					
					<div className="row">
						<Dropdown className='col-4' text='Estado da Candidatura' setValue={setState}>
							<option>Submetido</option>
							<option>Revisão</option>
							<option>Colocado</option>
							<option>Protocolo ISEC</option>
							<option>Protocolo Empresa</option>
							<option>Protocolo Aluno</option>
							<option>Pode iniciar Estágio</option>
						</Dropdown>
					</div>

				</div>
			</section>

			<section className='p-0'>
				<h4>Propostas</h4>

				{list.length === 0 && <Alert text='Não existe nenhum docente de momento' type='danger' />}

				{list.length > 0 && (
					<table>
						<tr className='header'>
							<th><p>#</p></th>
							<th><p>Proposta</p></th>
							<th><p>Empresa/Docente</p></th>
							<th><p>Estado</p></th>
							<th></th>
						</tr>

						{list.map(proposal => (
							<Row key={proposal.id} {...proposal} />
						))}
						
					</table>
				)}
				
			</section>

			<section className="buttons d-flex flex-row gap-3 col-sm-12 col-md-5 p-0">
				<PrimaryButton action={submit} content={<h6>Guardar</h6>} />
				<SecundaryButton action={cancel} content={<h6>Cancelar</h6>} />
			</section>
		</div>
	);

}

export default Edit;