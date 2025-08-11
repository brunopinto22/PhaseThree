import './calendar.css';

function Calendar({SubmissionsStart = "dd/mm/aaaa", SubmissionsEnd = "dd/mm/aaaa", Divulgation = "dd/mm/aaaa", Candidatures = "dd/mm/aaaa", Placements = "dd/mm/aaaa"}) {

	return(
		<div className='calendar d-flex flex-column'>
			<div className="title d-flex flex-row align-items-center"><i className="bi bi-calendar4-week"></i><h3>Prazos</h3></div>
			<div className="dates d-flex flex-column">
				<p><b>Submissão de Propostas: </b>{SubmissionsStart} a {SubmissionsEnd}</p>
				<p><b>Divulgação de Projetos/Estágios: </b>{Divulgation}</p>
				<p><b>Candidaturas: </b>{Candidatures}</p>
				<p><b>Colocações: </b>{Placements}</p>
			</div>
		</div>
	)

}

export default Calendar;