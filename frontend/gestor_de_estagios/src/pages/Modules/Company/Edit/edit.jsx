import './edit.css';
import default_pfp from './../../../../assets/imgs/default_pfp.jpg';

import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearchParams } from "react-router-dom";
import { PrimaryButton, PrimaryButtonSmall, SecundaryButton, TextInput, Dropdown, CheckBox } from '../../../../components';
import { editCompany, getCompany } from '../../../../helpers/company';
import { UserContext } from '../../../../contexts';

const Edit = () =>  {

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
	const [status, setStatus] = useState([]);
	const [error, setError] = useState([]);

	const id = searchParams.get("id");
	
	const [name, setName] = useState(null);
	const [email, setEmail] = useState(null);
	const [address, setAddress] = useState(null);
	const [postalCode, setPostalCode] = useState(null);
	const [nipc, setNipc] = useState(null);
	const [contact, setContact] = useState(null);
	const [website, setWebsite] = useState(null);
	const [linkedin, setLinkedin] = useState(null);


	useEffect(() => {
		if (id) {
			getCompany(userInfo.token, id, setStatus, setError).then(c => {
				setName(c.name);
				setEmail(c.email);
				setAddress(c.address);
				setPostalCode(c.postal_code);
				setNipc(c.nipc);
				setContact(c.contact);
				setWebsite(c.website);
				setLinkedin(c.linkedin);
			});
		}
		else
			navigate("/404")
	}, [id]);


	const submit = () => {

		const data = {
			"name": name,
			"email": email,
			"address": address,
			"postal_code": postalCode,
			"nipc": nipc,
			"contact": contact,
			"website": website,
			"linkedin": linkedin,
		}

		if(editCompany(userInfo.token, id, data, setStatus, setError))
			cancel();

	}
	
	const cancel = () => {
		if (window.history.length > 2)
			navigate(-1);
		else
			navigate('/');
	}


	return(
		<div id='company' className='d-flex flex-column'>

			<section className='row p-0'>
				<h4>Dados da Empresa</h4>
				<div className='d-flex flex-column gap-3'>
					
					<div className="inputs d-flex flex-column flex-md-row col-sm-12 col-md-12">
						<TextInput className='col' text='Nome da Empresa' value={name} setValue={setName} />
						<TextInput className='col' text='Email' type='email' value={email} setValue={setEmail} />
					</div>

					<div className="inputs d-flex flex-column flex-md-row col-sm-12 col-md-12">
						<TextInput className='col' text='Endereço' value={address} setValue={setAddress} />
						<TextInput className='col' text='Código Postal' value={postalCode} setValue={setPostalCode} />
						<TextInput className='col' text='NIPC' value={nipc} setValue={setNipc} />
					</div>

					<div className="inputs d-flex flex-column flex-md-row col-sm-12 col-md-12">
						<TextInput className='col' text='Contacto' value={contact} setValue={setContact} />
						<TextInput className='col' text='Website' value={website} setValue={setWebsite} />
						<TextInput className='col' text='Linkedin' value={linkedin} setValue={setLinkedin} />
					</div>

				</div>
			</section>

			<section className="buttons d-flex flex-row gap-3 col-sm-12 col-md-5 p-0">
				<PrimaryButton action={submit} content={<h6>Guardar</h6>} />
				<SecundaryButton action={cancel} content={<h6>Cancelar</h6>} />
			</section>

			{error && <p className='error-message'>{error}</p>}
		</div>
	);

}

export default Edit;