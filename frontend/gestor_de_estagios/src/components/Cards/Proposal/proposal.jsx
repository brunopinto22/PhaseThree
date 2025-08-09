import { useNavigate } from 'react-router-dom';
import './proposal.css';
import { useState } from 'react';

const Proposal = ({className = "", id = -1, name = "No proposal name given", idCompany = -1, company = "No company name given", slots = 0, slotsTaken = 0, location = "No location given", state="", canFav = true, favourite = false, disabled = false}) => {

	const navigate = useNavigate();
	const [fav, setFav] = useState(favourite);

	const openProposal = () => {
		if(id > 0)
			navigate("/proposal/view?id=" + id);
	}
	const openCompany = () => {
		if(idCompany > 0)
			navigate("/company/view?id=" + idCompany);
	}

	const toogleFavorite = () => {
		if(canFav)
			setFav(!fav);
	}

	return(
		<div className={`card-proposal ${disabled ? "disabled" : state} d-flex flex-column ${className}`}>
			
			<div className="card-title d-flex flex-column">
				<div> <h6 onClick={openProposal} style={{cursor: "pointer"}}>{name}</h6> </div>
				<div> <p onClick={openCompany} style={{cursor: "pointer"}}>{company}</p> </div>
			</div>

			<div className="card-footer d-flex flex-row justify-content-between align-items-center gap-5">

				<div>{canFav && <i style={{cursor: "pointer"}} onClick={toogleFavorite} className={`${fav ? 'fav' : ''} bi bi-heart${fav ? '-fill' : ''}`}></i>}</div>

				<div className='card-description d-flex flex-row gap-4'>
					<p><b>Nº de vagas:</b> {slotsTaken}/{slots}</p>
					<p><i className="bi bi-geo-alt-fill"></i>{location}</p>
				</div>

			</div>

		</div>
	);

}

export default Proposal;