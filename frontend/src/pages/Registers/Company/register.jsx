import './register.css';
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from './../../../assets/imgs/logo.png';
import bg from './.././../../assets/imgs/company.jpg';
import { PrimaryButton, TertiaryButton, TextInput, PasswordInput } from './../../../components';
import { getSupportEmail } from '../../../services';
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

	const [name, setName] = useState();
	const [email, setEmail] = useState();
	const [address, setAdress] = useState();
	const [code, setCode] = useState();
	const [nipc, setNipc] = useState();
	const [contact, setContact] = useState();
	const [website, setWebsite] = useState();
	const [linkedin, setLinkedin] = useState();

	const [errorMessage, setErrorMessage] = useState("");
	const [error, setError] = useState(false);

	const { setCompanyInfo } = useContext(CompanyContext);

	const submit = () => {
		setCompanyInfo({ name, email, address, code, nipc, contact, website, linkedin });
		navigate("/register/representative")
	}

	return(
		<div id="register-company">
			<section className='d-flex flex w-100'>

				<div className='form d-flex flex-column justify-content-between w-100'>
					<div className='title-container d-flex flex-column'>
						<h5 className='sub-title'>Registar</h5>
						<h1 className='title'>Empresa</h1>
					</div>

					<form>

						<TextInput text='Nome da Empresa' value={name} setValue={setName} />
						<TextInput text='Email da Empresa' value={email} setValue={setEmail} />
						<div className="d-flex flex-row gap-3">
							<TextInput className='col-8' text='Morada' value={address} setValue={setAdress} />
							<TextInput className='col' text='Código Postal' value={code} setValue={setCode} />
						</div>
						<TextInput text='NIPC' type='number' value={nipc} setValue={setNipc} />
						<TextInput text='Contacto' type='number' value={contact} setValue={setContact} />
						<TextInput text='Website' value={website} setValue={setWebsite} />
						<TextInput text='Linkedin' value={linkedin} setValue={setLinkedin} />

            <PrimaryButton type='submit' content={<h6>Registar</h6>} action={submit} />
						{error && (<p className='error-message'>{errorMessage}</p>)}
					</form>

          <div className='help'>
            <p>Já tem uma conta criada? <a href="\">Faça login</a></p>
            <p>Tem dúvidas? Contacte-nos: <a href={`mailto:${supportEmail}`}>{supportEmail}</a></p>
          </div>

				</div>

				<div className='image-container d-none d-md-flex w-75' style={{backgroundImage: `url(${bg})`}}>
					<img src={logo}/>
				</div>

			</section>
		</div>
	);

}

export default Register;