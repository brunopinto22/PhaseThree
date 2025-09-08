import './unauthorized.css';
import { useState, useEffect } from 'react';
import { PrimaryButton } from '../../components';
import { useNavigate } from 'react-router-dom';
import { getSupportEmail } from '../../services';

function Unauthorized() {
	const navigate = useNavigate();
	const [supportEmail, setSupportEmail] = useState('');

	useEffect(() => {
		const fetchEmail = async () => {
			const email = await getSupportEmail();
			setSupportEmail(email);
		};
		fetchEmail();
	}, []);

	return(
		<div id="unauthorized">
			<section className='d-flex w-100'>
		
				<div className="content d-flex flex-column align-items-center justify-content-center w-100 h-100">
					<div className='d-flex flex-column align-items-center'>
						<h1 className='title'>401</h1>
						<h2 className='sub-title'>Não tem autorização para aceder a esta página</h2>
						<h6>É necessária autenticação para aceder a esta página.</h6>
					</div>
					<PrimaryButton small action={() => navigate("/login")} content={<p>Fazer Login</p>} />
					<p>Tem dúvidas? Contacte-nos: <a href={`mailto:${supportEmail}`}>{supportEmail}</a></p>
				</div>

			</section>
		</div>
	);

}

export default Unauthorized;