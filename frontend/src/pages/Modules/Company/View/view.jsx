import './view.css';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';
import { Alert, OptionButton, PrimaryButton, ProposalCard } from '../../../../components';
import { getCompany } from '../../../../services';
import { UserContext } from '../../../../contexts';
import Proposals from './Lists/proposals'

function View() {

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

	const [searchParams] = useSearchParams();
  const id = searchParams.get('id');

	const [status, setStatus] = useState([]);
	const [error, setError] = useState([]);

	const [company, setCompany] = useState({
		active: false,
		name: "",
		email: "",
		address: "",
		postal_code: "",
		nipc: 0,
		contact: "",
		website: "",
		linkedin: "",
		representatives: [],
		representatives_count: 0,
		proposals: [],
		proposals_count: 0,
	});


	useEffect(() => {
		async function fetchCompany() {
			if (!id) {
				navigate('/pagenotfound');
				return;
			}

			const data = await getCompany(userInfo.token, id, setStatus, setError);

			if (status === 404) {
				navigate('/pagenotfound');
				return;
			}
			if (status === 200 && data) {
				setCompany(data);
			}
		}
		fetchCompany();
	}, [id, userInfo.token, navigate, status]);


	const name = company.name;
	const nipc = company.nipc;
	const address = company.address;
	const postal_code = company.postal_code;
	const email = company.email;
	const contact = company.contact;
	const website = company.website;
	const linkedin = company.linkedin;
	const representatives = company.representatives;
	const nRepresentatives = company.representatives_count;
	const proposals = company.proposals;
	const nProposals = company.proposals_count;


	const [seeR, setSeeR] = useState(false);
	const [seeP, setSeeP] = useState(false);


	const Row = ({id, name, email, role}) => {

		const isAdminRep = role === "representative" && representatives.find(rep => rep.admin)?.id === userInfo.id;
		const isNotSelf = id !== userInfo.id;

		const canEdit = 
			role === "admin" ||
			permissions["Empresas"].edit ||
			(isAdminRep && isNotSelf);

		const canDelete = 
			role === "admin" ||
			permissions["Empresas"].delete ||
			(isAdminRep && isNotSelf);
		
		const view = () => {
			navigate("/representative/view?id="+id);
		}
		const edit = () => {
			navigate("/representative/edit?id="+id);
		}

		return(
			<tr className='table-row'>
				<th><p>{role}</p></th>
				<th><p>{name}</p></th>
				<th><p><a href={`mailto:`+ email}>{email}</a></p></th>
				<th>
					<div className='d-flex gap-2'>
						<OptionButton type='view' action={view} />
						{canEdit && <OptionButton type='edit' action={edit} />}
						{canDelete && <OptionButton type='delete' action={view} />}
					</div>
				</th>
			</tr>
		);
	}


	return(
		<div id='company' className='d-flex flex-column'>

			<div className="header d-flex flex-column">
				<h2 className='title'>{name}</h2>
				<div className="info d-flex flex-column flex-md-row">
					<div className="d-flex flex-column gap-2">
						<p className='d-flex flex-row gap-2'><b>#</b><b>NIPC:</b> {nipc}</p>
						<p className='d-flex flex-row gap-2'><i className="bi bi-person-fill"></i><b>Representante:</b> {representatives.find(rep => rep.admin)?.name || '—'}</p>
						<p className='d-flex flex-row gap-2'><i className="bi bi-geo-alt-fill"></i><b>Morada:</b> {address}, {postal_code}</p>
						<p className='d-flex flex-row gap-2'><i className="bi bi-telephone-fill"></i><b>Contacto:</b> {contact}</p>
					</div>
					<div className="d-flex flex-column gap-2">
						<p className='d-flex flex-row gap-2'><i className="bi bi-envelope"></i><b>Email:</b> <a href={`mailto:`+ email}>{email}</a></p>
						{website && <p className='d-flex flex-row gap-2'><i className="bi bi-globe"></i><b>Website:</b> <a href={website.startsWith('http') ? website : `https://${website}`} target="_blank">{website}</a></p>}
						{linkedin && <p className='d-flex flex-row gap-2'><i className="bi bi-linkedin"></i><b>LinkedIn:</b> <a href={linkedin.startsWith('http') ? linkedin : `https://${linkedin}`} target="_blank">{linkedin}</a></p>}
					</div>
				</div>
			</div>

			<div className='representatives d-flex flex-column gap-4'>
				<div className="d-flex flex-row align-content-center">
					<h4 className='d-flex flex-row align-items-center gap-2 noselect' style={{cursor: "default"}} onClick={() => setSeeR(!seeR)}>
						<i className={`toggle-collapse bi bi-chevron-down`} style={{ transform: `rotateZ(${seeR ? "0" : "-90deg"})` }}></i>
						<span>Contactos{nRepresentatives > 0 && <span style={{fontSize: "small"}}> ({nRepresentatives} {nRepresentatives === 1 ? "contacto" : "contactos"})</span>}</span>
					</h4>
				</div>
				<div className={`collapsible ${seeR ? "" : "collapse"}`}>
					{representatives?.length === 0 && <Alert text='Não existe nenhum representante de momento' />}

					{representatives.length > 0 && (
						<table>
							<tr className='header'>
								<th className='fit-column'><p>Cargo</p></th>
								<th><p>Nome</p></th>
								<th><p>Email</p></th>
								<th className='fit-column'></th>
							</tr>

							{representatives.map(representative => (
								<Row key={representative.id} {...representative} />
							))}
							
						</table>
					)}
				</div>
			</div>

						<div className='proposals d-flex flex-column gap-4'>
				<div className="d-flex flex-row align-content-center">
					<h4 className='title d-flex flex-row align-items-center gap-2 noselect' style={{ cursor: "default" }} onClick={() => setSeeP(!seeP)}>
						<i className={`toggle-collapse bi bi-chevron-down`} style={{ transform: `rotateZ(${seeP ? "0" : "-90deg"})` }}></i>
						<span>Propostas{nProposals > 0 && <span style={{fontSize: "small"}}> ({nProposals} {nProposals === 1 ? "proposta" : "propostas"})</span>}</span>
					</h4>
				</div>
				<div className={`collapsible ${seeP ? "" : "collapse"}`}>
					<Proposals list={proposals} />
				</div>
			</div>


		</div>
	);

}

export default View;