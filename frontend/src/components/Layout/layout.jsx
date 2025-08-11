import './layout.css';
import { Navbar, Footer } from '..';
import { Outlet } from 'react-router-dom';

function Layout({setToken, role}) {

	return(
		<>
			<Navbar setToken={setToken} role={role} />
				<main>
					<Outlet />
				</main>
		</>
	);

}

export default Layout;