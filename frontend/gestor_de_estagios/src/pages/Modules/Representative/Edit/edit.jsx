import './edit.css';
import default_pfp from './../../../../assets/imgs/default_pfp.jpg';

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearchParams } from "react-router-dom";
import { PrimaryButton, PrimaryButtonSmall, SecundaryButton, TextInput, Dropdown, OptionButton } from '../../../../components';

const Edit = () =>  {

	const navigate = useNavigate();
	const [searchParams] = useSearchParams();

	const id = searchParams.get("id");
  const isNew = searchParams.get("new");
	
	const [profilePicture, setProfilePicture] = useState(null);
	const [fullName, setFullName] = useState(null);
	const [email, setEmail] = useState(null);
	const [contact, setContact] = useState(null);
	const [role, setRole] = useState(null);


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


	return(
		<div id='representatives' className='d-flex flex-column'>
			<section className='row p-0'>
				<h4>Perfil</h4>
				<div className="profile d-flex flex-column flex-md-row p-0 col-sm-12 col-md-4">
					<div className="profile-picture h-100" style={{backgroundImage: `url(${ profilePicture ? profilePicture : default_pfp })`}}></div>
					<div className="options d-flex flex-column justify-content-center w-100">
						<PrimaryButtonSmall content={<p>Alterar Foto de Perfil</p>} />
						<PrimaryButtonSmall content={<p>Alterar Palavra-Passe</p>} />
					</div>
				</div>
			</section>

			<section className='row p-0'>
				<h4>Dados Pessoais</h4>
				<div className='row'>
					
					<div className="inputs d-flex flex-column ">
						<div className="inputs d-flex flex-row p-0">
							<TextInput className='col' text='Nome Completo' value={fullName} setValue={setFullName} />
							<TextInput className='col' text='Cargo' value={role} setValue={setRole} />
						</div>

						<div className="inputs d-flex flex-row">
							<TextInput className='col' text='Email' value={email} setValue={setEmail} />
							<TextInput className='col' text='Contacto' type='number' value={contact} setValue={setContact} />
						</div>
					</div>

				</div>
			</section>

			<section className="buttons d-flex flex-row gap-3 col-sm-12 col-md-5 p-0">
				<PrimaryButton action={submit} content={<h6>Guardar</h6>} />
				<SecundaryButton action={cancel} content={<h6>Cancelar</h6>} />
			</section>
		</div>
	);

}

export default Edit;