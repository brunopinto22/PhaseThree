import './user.css';
import default_pfp from './../../../assets/imgs/default_pfp.jpg';


const UserCard = ({pfp = null, name = "Name", action = () => {}, className = "", empty = false, message = ""}) => {

	const click = () => {
		if(!empty)
			action();
	}

	return(
		<div className={`user-card ${empty ? "empty-card justify-content-center" : ""} d-flex flex-row align-items-center ${className}`} onClick={click}>
		{!empty ?
			(<>
				<div className="profile-picture" style={{ backgroundImage: `url(${pfp === null ? default_pfp : pfp})` }}></div>
				<h6>{name}</h6>
			</>)
			:
			(<>
				<p>{message}</p>
			</>)
		}
		</div>
	);

}

export default UserCard;