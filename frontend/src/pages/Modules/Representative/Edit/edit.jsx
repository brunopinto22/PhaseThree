import './edit.css';
import default_pfp from './../../../../assets/imgs/default_pfp.jpg';

import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearchParams } from "react-router-dom";
import { PrimaryButton, SecundaryButton, TextInput, Dropdown, OptionButton, CheckBox, PfpModal } from '../../../../components';
import { editRepresentative, getRepresentative } from '../../../../services';
import { UserContext } from '../../../../contexts';

const Edit = () =>  {
	const { userInfo } = useContext(UserContext);

	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const [show, setShow] = useState(false);
	const [status, setStatus] = useState(0);
	const [error, setError] = useState("");

	const id = searchParams.get("id");
  const isNew = searchParams.get("new");
	
	const [active, setActive] = useState(null);
	const [pfp, setPfp] = useState(null);
	const [fullName, setFullName] = useState(null);
	const [email, setEmail] = useState(null);
	const [contact, setContact] = useState(null);
	const [role, setRole] = useState(null);


	useEffect(() => {
		if (id && !isNew) {
			getRepresentative(userInfo.token, id, setStatus, setError).then(data => {
				setActive(data.active)
				setPfp(data.pfp);
				setFullName(data.name);
				setEmail(data.email);
				setContact(data.contact);
				setRole(data.role);
			});
		}
	}, [id, isNew]);

	const submit = async () => {
		const data = {
			active: active,
			name: fullName,
			email: email,
			contact: contact,
			role: role,
		}

		if(await editRepresentative(userInfo.token, id, data, setStatus, setError)) {
			cancel()
		}

	}
	
	const cancel = () => {
		if (window.history.length > 2)
			navigate(-1);
		else
			navigate('/');
	}


	return(
		<>

		<div id='representatives' className='d-flex flex-column'>
			<section className='row p-0'>
				<h4>Perfil</h4>
				<div className="profile d-flex flex-column flex-md-row p-0 col-sm-12 col-md-4">
					<div className="profile-picture h-100" style={{backgroundImage: `url(${ pfp ? pfp : default_pfp })`}}></div>
					<div className="options d-flex flex-column justify-content-center w-100">
						{(userInfo?.role === "admin" || (userInfo?.role === "teacher" && userInfo.id !== id) || userInfo?.perms["Alunos"].edit) && <CheckBox value={active} setValue={setActive} label={"Ativo"} />}
						<PrimaryButton small content={<p>Alterar Foto de Perfil</p>} action={() => setShow(true)} />
						<PrimaryButton small content={<p>Alterar Palavra-Passe</p>} action={() => navigate("/setPassword", { state: { email } })} />
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

		<PfpModal show={show} setShow={setShow} email={email} />	

		</>
	);

}

export default Edit;