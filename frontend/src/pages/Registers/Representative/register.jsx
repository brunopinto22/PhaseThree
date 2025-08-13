import './register.css';
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import logo from './../../../assets/imgs/logo.png';
import bg from './.././../../assets/imgs/company.jpg';
import { PrimaryButton, TertiaryButton, TextInput, PasswordInput } from './../../../components';
import { getSupportEmail, registerCompany } from '../../../services';
import { CompanyContext } from '../../../contexts';

const Register = () => {

	const navigate = useNavigate();
	const [supportEmail, setSupportEmail] = useState('');

	useEffect(() => {
		const fetchEmail = async () => {
			const email = await getSupportEmail();
			setSupportEmail(email);
		};
		fetchEmail();
	}, []);

	const [searchParams] = useSearchParams();
	const invite = searchParams.get("invite");
	const id = searchParams.get("id");
	const { companyInfo } = useContext(CompanyContext);

	const company = null;
	if(!invite && !companyInfo) {
		navigate("/unauthorized");
	}


	const [name, setName] = useState();
	const [email, setEmail] = useState();
	const [role, setRole] = useState();
	const [contact, setContact] = useState();
	const [password, setPassword] = useState();
	const [repeat, setRepeat] = useState();

	const [errorMessage, setErrorMessage] = useState("");
	const [error, setError] = useState(false);

	const [status, setStatus] = useState([]);
	const [errorM, setErrorM] = useState([]);

	const submit = () => {

		const data = {
			company_name: companyInfo.name,
			company_email: companyInfo.email,
			company_address: companyInfo.address,
			company_postal_code: companyInfo.code,
			company_nipc: companyInfo.nipc,
			company_website: companyInfo.website,
			company_linkedin: companyInfo.linkedin,
			company_contact: companyInfo.contact,

			representative_email: email,
			representative_name: name,
			representative_role: role,
			representative_contact: contact,
			representative_password: password,
		};

		console.log(data)

		if (!invite) {
			if(registerCompany(data, setStatus, setErrorM)){
				navigate("/");
			}
		} else {
			
		}
	}


	return(
		<div id="register-representative">
			<section className='d-flex flex w-100'>

				<div className='image-container d-none d-md-flex w-75' style={{backgroundImage: `url(${bg})`}}>
					<img src={logo}/>
				</div>

				<div className='form d-flex flex-column justify-content-between w-100'>
					<div className='title-container d-flex flex-column'>
						<h5 className='sub-title'>Registar</h5>
						<h1 className='title'>Representante</h1>
					</div>

					<form>

						<TextInput text='Nome Completo' value={name} setValue={setName} />
						<TextInput text='Email' value={email} setValue={setEmail} />
						<TextInput text='Cargo' value={role} setValue={setRole} />
						<TextInput text='Contacto' type='number' value={contact} setValue={setContact} />
						<PasswordInput text='Palavra-Passe' value={password} setValue={setPassword} />
						<PasswordInput text='Confirmar Palavra-Passe' value={repeat} setValue={setRepeat} />

            <PrimaryButton type='submit' content={<h6>Registar</h6>} action={submit} />
						{error && (<p className='error-message'>{errorMessage}</p>)}
					</form>

          <div className='help'>
            <p>Já tem uma conta criada? <a href="\">Faça login</a></p>
            <p>Tem dúvidas? Contacte-nos: <a href={`mailto:${supportEmail}`}>{supportEmail}</a></p>
          </div>

				</div>

			</section>
		</div>
	);

}

export default Register;