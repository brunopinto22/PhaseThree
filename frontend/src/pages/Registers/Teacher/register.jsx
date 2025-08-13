import './register.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from './../../../assets/imgs/logo.png';
import bg from './../../../assets/imgs/teacher.jpg';
import { PrimaryButton, TertiaryButton, TextInput, PasswordInput, Dropdown } from '../../../components';
import { getSupportEmail, getScientificAreas } from '../../../services';


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
	const [areas, setAreas] = useState([]);
	useEffect(() => {
		const fetchAreas = async () => {
			const areas = await getScientificAreas();
			setAreas(areas);
		};
		fetchAreas();
	}, []);

	const [name, setName] = useState();
	const [email, setEmail] = useState();
	const [category, setCategory] = useState();
	const [area, setArea] = useState();
	const [password, setPassword] = useState();
	const [repeat, setRepeat] = useState();

	const [errorMessage, setErrorMessage] = useState("");
	const [error, setError] = useState(false);


	return(
		<div id="register-student">
			<section className='d-flex flex w-100'>

				<div className='image-container d-none d-md-flex w-100' style={{backgroundImage: `url(${bg})`}}>
					<img src={logo}/>
				</div>

				<div className='form d-flex flex-column justify-content-between w-100'>
					<div className='title-container d-flex flex-column'>
						<h5 className='sub-title'>Registar</h5>
						<h1 className='title'>Docente</h1>
					</div>

					<form>

						<TextInput text='Nome Completo' value={name} setValue={setName} />
						<TextInput text='Email' type='email' value={email} setValue={setEmail} />
						
						<div className="d-flex flex-column flex-md-row gap-3">
							<Dropdown className='col' text='Área Científica' value={area} setValue={setArea}>
								{areas.map((a) => (
									<option key={a.id_area} value={a.id_area}>
										{a.area_name}
									</option>
								))}
							</Dropdown>
							<Dropdown className='col' text='Categoria' value={category} setValue={setCategory}>
								<option value="Professor Coordenador Principal com Agregação">Professor Coordenador Principal com Agregação</option>
								<option value="Professor Coordenador Principal">Professor Coordenador Principal</option>
								<option value="Professor Coordenador com Agregação">Professor Coordenador com Agregação</option>
								<option value="Professor Coordenador">Professor Coordenador</option>
								<option value="Professor Adjunto com Agregação">Professor Adjunto com Agregação</option>
								<option value="Professor Adjunto">Professor Adjunto</option>
								<option value="Assistente">Assistente</option>
								<option value="Professor Coordenador convidado">Professor Coordenador convidado</option>
								<option value="Professor Adjunto convidado">Professor Adjunto convidado</option>
								<option value="Assistente convidado">Assistente convidado</option>
							</Dropdown>
						</div>

						<PasswordInput text='Palavra-Passe' value={password} setValue={setPassword} error={password !== repeat && repeat !== "" && password !== ""} />
						<PasswordInput text='Confirmar Palavra-Passe' value={repeat} setValue={setRepeat} error={password !== repeat && repeat !== "" && password !== ""} />

            <PrimaryButton type='submit' content={<h6>Registar</h6>} action={() => console.log("registei ?")} />
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