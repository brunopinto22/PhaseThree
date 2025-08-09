import './navbar.css';
import logo from './../../assets/imgs/logo.png';
import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../contexts';

function Navbar({setToken, role = null}) {

	const navigate = useNavigate(); 
	const { userInfo } = useContext(UserContext);

	const hideProfile = !userInfo?.role || userInfo.role === "admin";

	const logout = () => {
		setToken(null);
		localStorage.clear();
	}

	return(
		<nav>
			<a className='nav-icon' href="/"><img src={logo} alt='isec_logo' /></a>

			<div className='nav-side'>
				{!hideProfile && <a href="" onClick={() => navigate(`/${userInfo.role}/view?id=${userInfo.id}`)} className="nav-link">Perfil</a>}
				<a href="/" className="nav-link" onClick={logout}>Sair</a>
			</div>
		</nav>
	);

}

export default Navbar;