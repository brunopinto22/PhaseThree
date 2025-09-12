import './view.css';
import React, { useState, useEffect, useContext } from 'react';
import default_pfp from './../../../../assets/imgs/default_pfp.jpg';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PrimaryButton, Alert } from '../../../../components';
import { getRepresentative } from '../../../../services';
import { UserContext } from '../../../../contexts';

function View() {

	const navigate = useNavigate();
	const { userInfo } = useContext(UserContext);
	const [searchParams] = useSearchParams();
  const id = searchParams.get('id');

	const [status, setStatus] = useState([]);
	const [error, setError] = useState([]);

	const [rep, setRep] = useState({
		pfp: null,
		active: false,
		name: "",
		role: "",
		email: "",
		contact: "",
		company_id: "",
		company_name: "",
		can_edit_company: false,
		can_edit: false,
	});

	const pfp = rep.pfp;
	const fullName = rep.name;
	const parts = fullName.trim().split(" ");
	const shortName = parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1]}` : fullName;
	const role = rep.role;
	const email = rep.email;
	const contact = rep.contact;
	const idCompany = rep.company_id;
	const canEditCompany = rep.can_edit_company;
	const canEdit = rep.can_edit;


	useEffect(() => {
		async function fetch() {
			if (!id) {
				navigate('/pagenotfound');
				return;
			}
			const data = await getRepresentative(userInfo.token, id, setStatus, setError);

			if (status === 404) {
				navigate('/pagenotfound');
				return;
			}
			if (status === 200 && data) {
				setRep(data);
			}
		}
		fetch();
	}, [id, userInfo, navigate, status]);



	return(
		<div id='profile' className='row'>

			<div className="profile-card d-flex flex-column col-sm-12 col-md-4">

				<div className="card d-flex flex-row">
					<div className="profile-picture" style={{ backgroundImage: `url(${pfp === null ? default_pfp : pfp})` }}></div>
					<div className="profile-title d-flex flex-column justify-content-center">
						<h3>{shortName}</h3>
						<h5>{role}</h5>
					</div>
				</div>

				<div className="options">
					<PrimaryButton action={() => navigate("/company/view?id="+idCompany)} content={<h6>Ver Página da Empresa</h6>}/>
					{canEditCompany && (<PrimaryButton action={() => navigate("/company/edit?id="+idCompany)} content={<h6>Editar Dados da Empresa</h6>}/>)}
					{canEdit && (<PrimaryButton action={() => navigate("/representative/edit?id="+id)} content={<h6>Editar Perfil</h6>}/>)}
				</div>

			</div>

			<div className="profile-info col-sm-12 col-md">

				<div className="section">
					<h4>Dados Pessoais</h4>
					<div className="content d-flex flex-column">
						<div className="content-row"><p><b>Nome Completo: </b>{fullName}</p></div>
						<div className="content-row"><p><b>Cargo: </b>{role}</p></div>
						<div className="content-row"><p><b>Email: </b>{email}</p></div>
						<div className="content-row"><p><b>Contacto: </b>{contact}</p></div>
					</div>
				</div>

			</div>

		</div>
	);

}

export default View;