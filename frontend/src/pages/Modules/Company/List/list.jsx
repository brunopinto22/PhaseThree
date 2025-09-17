import './list.css';
import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OptionButton, PrimaryButton, Alert } from '../../../../components';
import { deleteCompany, listCompanies } from '../../../../services';
import { UserContext } from '../../../../contexts';
import { useDebounce } from '../../../../utils';

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
		const handleDelete = async () => {
			await deleteCompany(userInfo.token, id, setStatus, setError);
			setReload(!reload);
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


	const [name, setName] = useState(null);
	const [email, setEmail] = useState(null);
	const [rep, setRep] = useState(null);
	const [repEmail, setRepEmail] = useState(null);
	
	const debouncedName = useDebounce(name, 300);
	const debouncedEmail = useDebounce(email, 300);
	const debouncedRep = useDebounce(rep, 300);
	const debouncedRepEmail = useDebounce(repEmail, 300);
	
	useEffect(() => {
		updateFilter('name', debouncedName);
		updateFilter('email', debouncedEmail);
		updateFilter('rep', debouncedRep);
		updateFilter('rep_email', debouncedRepEmail);
	}, [debouncedName, debouncedEmail, debouncedRep, debouncedRepEmail]);

	const [filters, setFilters] = useState({
		name: null,
		email: null,
		rep: null,
		rep_email: null,
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
				(filters.name === null || item.name.toLowerCase().includes(filters.name.toLowerCase())) &&
				(filters.email === null || item.email.toLowerCase().includes(filters.email.toLowerCase())) &&
				(filters.rep === null || item.admin.name.toLowerCase().includes(filters.rep.toLowerCase())) &&
				(filters.rep_email === null || item.admin.email.toLowerCase().includes(filters.rep_email.toLowerCase()))
			);
		});
	};

	return(
		<div className='companies-list d-flex flex-column'>

			<div className="top d-flex flex-row justify-content-between">
				<div className="title"><h4>Empresas</h4></div>
			</div>

			{list.length === 0 && <Alert text='Não existe nenhum docente de momento' />}

			{list.length > 0 && (
				<table>
					<tr className='header'>
						<th><p><input placeholder='Empresa' onChange={(e) => setName(e.target.value)}/></p></th>
						<th><p><input placeholder='Email' onChange={(e) => setEmail(e.target.value)}/></p></th>
						<th><p><input placeholder='Representante' onChange={(e) => setRep(e.target.value)}/></p></th>
						<th><p><input placeholder='Email do Representante' onChange={(e) => setRepEmail(e.target.value)}/></p></th>
						<th className='fit-column'></th>
					</tr>

					{getFilteredList().map(company => (
						<Row key={company.id} {...company} />
					))}
					
				</table>
			)}
			{list.length > 0 && getFilteredList().length === 0 && <Alert text='Não foi encontrado nenhuma empresa' />}


		</div>
	);

}

export default List;