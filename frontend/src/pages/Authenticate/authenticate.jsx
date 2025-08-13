import './authenticate.css';
import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSupportEmail } from '../../services';
import { PrimaryButton, PasswordInput } from '../../components';
import logo from './../../assets/imgs/logo.png';
import { UserContext } from '../../contexts';

function Authenticate({setToken}) {

	const { setUserInfo } = useContext(UserContext);
	
	const [supportEmail, setSupportEmail] = useState('');
	useEffect(() => {
		const fetchEmail = async () => {
			const email = await getSupportEmail();
			setSupportEmail(email);
		};
		fetchEmail();
	}, []);

  const [password, setPassword] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
	const [error, setError] = useState(false);
  const navigate = useNavigate();

	return(
		
		<div id="authenticate">
			<section className='d-flex w-100 justify-content-center align-items-center'>

				<form className='d-flex flex-column'>
					<h3 className='title'>Confirmar acesso</h3>
					<div className="password-field">
						<PasswordInput text={"Palavra-Passe"} setValue={setPassword} error={error} />
						<a href="">Recuperar palavra-passe</a>
					</div>

					<PrimaryButton type='submit' content={<h6>Confirmar</h6>} className="w-100" />
					{error && (<p className='error-message'>{errorMessage}</p>)}

					<div className='help'>
						<p>Tem dúvidas? Contacte-nos: <a href={`mailto:${supportEmail}`}>{supportEmail}</a></p>
					</div>
				</form>

			</section>
		</div>

	);

}

export default Authenticate;