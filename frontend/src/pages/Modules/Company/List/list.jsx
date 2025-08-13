import './list.css';
import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OptionButton, PrimaryButtonSmall, Alert } from '../../../../components';
import { listCompanies } from '../../../../services';
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
		const fetchCompanies = async () => {
			const token = localStorage.getItem("access_token");
			const companies = await listCompanies(token, setStatus, setError);
			setList(companies);
		};

		fetchCompanies();
	}, [reload]);


	const add = () => {
		navigate("/company/edit?new=true");
	}


	const Row = ({active, id, name, email, admin}) => {
		
		const view = () => {
			navigate("/company/view?id="+id);
		}
		const edit = () => {
			navigate("/company/edit?id="+id);
		}
		const handleDelete = () => {
			// TODO : eliminar Empresa
		}

		return(
			<tr className={`table-row ${active ? "" : "disabled"}`}>
				<th><p>{name}</p></th>
				<th><p><a href={`mailto:`+ email}>{email}</a></p></th>
				<th><p>{admin.name}</p></th>
				<th><p><a href={`mailto:`+ admin.email}>{admin.email}</a></p></th>
				<th>
					<div className='d-flex gap-2'>
						<OptionButton type='view' action={view} />
						{(role === "admin" || permissions["Empresas"].edit) && <OptionButton type='edit' action={edit} />}
						{(role === "admin" || permissions["Empresas"].delete) && <OptionButton type='delete' action={handleDelete} />}
					</div>
				</th>
			</tr>
		);
	}

	return(
		<div className='companies-list d-flex flex-column'>

			<div className="top d-flex flex-row justify-content-between">
				<div className="title"><h4>Empresas</h4></div>
			</div>

			{list.length === 0 && <Alert text='Não existe nenhum docente de momento' />}

			{list.length > 0 && (
				<table>
					<tr className='header'>
						<th><p>Empresa</p></th>
						<th><p>Email</p></th>
						<th><p>Representante</p></th>
						<th><p>Email do Representante</p></th>
						<th className='fit-column'></th>
					</tr>

					{list.map(company => (
						<Row key={company.id} {...company} />
					))}
					
				</table>
			)}

		</div>
	);

}

export default List;