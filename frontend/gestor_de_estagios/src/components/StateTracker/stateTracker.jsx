import './stateTracker.css';


const StateTracker = ({currentState = 0}) => {

	const states = ['Submetido', 'Revisão', 'Colocado', 'Protocolo ISEC', 'Protocolo Empresa', 'Protocolo Aluno', 'Pode iniciar Estágio'];


	const State = ({index, value, currentState}) => {
		return (
			<div className={`state ${currentState > index ? "done" : currentState == index ? "current" : "to-do"}`}>
				<div className="icon noselect">{currentState > index ? <i className="bi bi-check-lg"></i> : <b>{index}</b>}</div>
				<p className="description">{value}</p>
			</div>
		);
	}


	return(
		<div className="state-tracker d-flex flex-row justify-content-between">

			{states.map((label, index) => (
				<State key={index} index={index+1} value={label} currentState={currentState} />
			))}

		</div>
	);

}

export default StateTracker;