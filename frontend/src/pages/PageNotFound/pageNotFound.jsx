import './pageNotFound.css';
import { useState, useEffect } from 'react';
import { PrimaryButtonSmall } from '../../components';
import { useNavigate } from 'react-router-dom';
import { getSupportEmail } from '../../services';

function PageNotFound() {
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
    <div id="not-found">
			<section className='d-flex w-100'>
		
				<div className="content d-flex flex-column align-items-center justify-content-center w-100 h-100">
					<div className='d-flex flex-column align-items-center'>
						<h1 className='title'>404</h1>
						<h2 className='sub-title'>Página não encontrada</h2>
					</div>
					<PrimaryButtonSmall action={() => navigate("/")} content={<p>Voltar para a Página Inicial</p>} />
					<p>Tem dúvidas? Contacte-nos: <a href={`mailto:${supportEmail}`}>{supportEmail}</a></p>
				</div>

			</section>
		</div>
  );

}

export default PageNotFound;