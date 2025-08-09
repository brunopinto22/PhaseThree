import './view.css';
import default_pfp from './../../../../assets/imgs/default_pfp.jpg';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PrimaryButton, Alert } from '../../../../components';

function View() {

	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
  const id = searchParams.get('id');

	const profilePicture = null;
	const fullName = "Marta Isabel Fonseca";
	const parts = fullName.trim().split(" ");
	const shortName = parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1]}` : fullName;
	const role = "Chefe";
	const email = "marta.fonseca@tekfusion.pt";
	const contact = 912345678;
	const idCompany = 1;


	// TODO : getRepresentative(id)
	// TODO : verificar se tem permissão / é o próprio
	const canEdit = true;
	const canEditCompany = true;

	return(
		<div id='profile' className='row'>

			<div className="profile-card d-flex flex-column col-sm-12 col-md-4">

				<div className="card d-flex flex-row">
					<div className="profile-picture" style={{backgroundImage: 'url(' + default_pfp +')'}}></div>
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