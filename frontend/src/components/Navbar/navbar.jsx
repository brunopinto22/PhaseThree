import './navbar.css';
import logo from './../../assets/imgs/logo.png';
import default_pfp from './../../assets/imgs/default_pfp.jpg';
import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../contexts';

function Navbar({setToken, role = null}) {

	const navigate = useNavigate(); 
	const { userInfo } = useContext(UserContext);

	const parts = userInfo?.name?.trim().split(" ");
	const shortName = parts?.length > 1 ? `${parts[0]} ${parts[parts?.length - 1]}` : userInfo?.name;

	const logout = () => {
		setToken(null);
		localStorage.clear();
	}

	return(
		<nav>
			<a className='nav-icon' href="/"><img src={logo} alt='isec_logo' /></a>

			<div className='nav-side align-items-center'>
				<div className="nav-link nav-acc d-flex flex-row gap-2 justify-content-center align-items-center" onClick={() => {if(userInfo.id !== "undefined") navigate(`/${userInfo.role}/view?id=${userInfo.id}`) }}>
					<p className="nav-link">{shortName}</p>
					<div className="nav-acc-img" style={{ backgroundImage: `url(${userInfo?.pfp === "null" ? default_pfp : userInfo.pfp})` }}></div>
				</div>
				<a href="/" className="nav-link" onClick={logout}>Sair</a>
			</div>
		</nav>
	);

}

export default Navbar;