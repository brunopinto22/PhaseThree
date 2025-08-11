import './setPassword.css';
import { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { getSupportEmail } from '../../helpers';
import { PrimaryButton, PasswordInput } from '../../components';
import { UserContext } from '../../contexts';
import { setUserPassword } from '../../services/user';

function SetPassword({setToken}) {
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
	
	const [supportEmail, setSupportEmail] = useState('');
	useEffect(() => {
		const fetchEmail = async () => {
			const email = await getSupportEmail();
			setSupportEmail(email);
		};
		fetchEmail();
	}, []);

	const location = useLocation();
  const email = location.state?.email;

	const [password, setPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");

	const [status, setStatus] = useState(null)
	const [error, setError] = useState(null);


	const submit = async () => {
		if(!email || email === "" || (confirmPassword != newPassword))
			return;

		const data = {
			email: email,
			old_password: password,
			new_password: newPassword,
		}

		let res = await setUserPassword(userInfo.token, data, setStatus, setError);
		if(res)
			navigate(-2)
	}


	return(
		
		<div id="setPassword">
			<section className='d-flex w-100 justify-content-center align-items-center'>

				<div className='form d-flex flex-column'>
					<h3 className='title'>Alterar Palavra-Passe</h3>

					<div className="d-flex flex-column gap-4">
						<PasswordInput text={"Palavra-Passe"} setValue={setPassword} />
						<PasswordInput text={"Nova Palavra-Passe"} setValue={setNewPassword} />
						<PasswordInput text={"Confirmar Palavra-Passe"} setValue={setConfirmPassword} error={confirmPassword != newPassword} />
					</div>

					<PrimaryButton type='submit' content={<h6>Confirmar</h6>} className="w-100" action={submit} />
					
					{status !== null && (<p className='error-message'>{error}</p>)}

					<div className='help'>
						<p>Tem dúvidas? Contacte-nos: <a href={`mailto:${supportEmail}`}>{supportEmail}</a></p>
					</div>
				</div>

			</section>
		</div>

	);

}

export default SetPassword;