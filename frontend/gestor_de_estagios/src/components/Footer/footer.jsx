import './footer.css';

function Footer() {

	const supportEmail = process.env.REACT_APP_SUPPORT_EMAIL;

	return(
		<footer>
			<p>Tem dúvidas? Contacte-nos: <a href={`mailto:${supportEmail}`}>{supportEmail}</a></p>
		</footer>
	);

}

export default Footer;