import './login.css';
import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, getSupportEmail } from '../../helpers';
import { PrimaryButton, TertiaryButton, TextInput, PasswordInput } from '../../components';
import logo from './../../assets/imgs/logo.png';
import bg from './../../assets/imgs/login.jpeg'
import { UserContext } from '../../contexts';

function Login({setToken}) {

	const { setUserInfo } = useContext(UserContext);
	
	const [supportEmail, setSupportEmail] = useState('');
	useEffect(() => {
		const fetchEmail = async () => {
			const email = await getSupportEmail();
			setSupportEmail(email);
		};
		fetchEmail();
	}, []);


  const [email, setEmail] = useState(null);
  const [password, setPassword] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
	const [error, setError] = useState(false);
  const navigate = useNavigate();

	const [waiting, setWaiting] = useState(false);

  const handleLogin = async () => {

		setWaiting(true);
		let res = !await login(navigate, email, password, setErrorMessage)
		setError(res);
		setWaiting(false);

    if(!res) {
			setToken(localStorage.getItem("access_token"));
			navigate("/");
		}

  };

	return(
		
		<div id="login" style={{opacity: waiting ? '0.6' : '1'}}>
			<section className='d-flex w-100'>
			
				<div className='image-container d-none d-md-flex col-md-6 col-lg-7' style={{backgroundImage: `url(${bg})`}}>
					<img src={logo}/>
				</div>

				<div className='form-container d-flex flex-column justify-content-between col-xs-12 col-md-6 col-lg-5'>
					<h1>Login</h1>

					<div className='form'>
						<TextInput text={"Email"} setValue={setEmail} error={error} />
						<div className="password-field">
              <PasswordInput text={"Palavra-Passe"} setValue={setPassword} error={error} />
              <a href="">Recuperar palavra-passe</a>
            </div>

            <PrimaryButton content={<h6>Login</h6>} action={handleLogin} />
						{error && (<p className='error-message'>{errorMessage}</p>)}
					</div>

          <div className='create-account'>

            <p>Ainda não tem conta? Registe-se.</p>
            
            <div className="btns">
              <TertiaryButton content={<p>Sou um Estudante</p>} action={() => navigate("/register/student")} />
              <TertiaryButton content={<p>Sou uma Empresa</p>} action={() => navigate("/register/company")} />
            </div>

          </div>

          <div className='help'>
            <p>Tem dúvidas? Contacte-nos: <a href={`mailto:${supportEmail}`}>{supportEmail}</a></p>
          </div>

				</div>

			</section>
		</div>

	);

}

export default Login;