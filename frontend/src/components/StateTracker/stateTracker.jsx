import './stateTracker.css';


const StateTracker = ({ currentState }) => {

	const states = [
		{ key: 'submitted', label: 'Submetida', description: 'Candidatura submetida' },
		{ key: 'revision', label: 'Em Revisão', description: 'Análise pelos serviços' },
		{ key: 'placed', label: 'Colocado', description: 'Aluno colocado' },
		{ key: 'protocol_generated', label: 'Protocolo', description: 'Protocolo gerado' },
		{ key: 'presidency_signature', label: 'ISEC', description: 'Assinatura ISEC' },
		{ key: 'company_signature', label: 'Empresa', description: 'Assinatura empresa' },
		{ key: 'student_signature', label: 'Aluno', description: 'Assinatura aluno' },
		{ key: 'finished', label: 'Concluído', description: 'Processo completo' }
	];

	const currentIndex = states.findIndex(s => s.key === currentState);

	const State = ({ index, state, isCurrent, isDone }) => {
		return (
			<div className={`state ${isDone ? "done" : isCurrent ? "current" : "to-do"}`}>
				<div className="icon noselect">
					{isDone ? <i className="bi bi-check-lg"></i> : <b>{index}</b>}
				</div>
				<p className="label">{state.label}</p>
				<p className="description">{state.description}</p>
			</div>
		);
	};


	return(
		<div className="state-tracker d-flex flex-row justify-content-between">
			{states.map((state, index) => (
				<State 
					key={state.key} 
					index={index + 1} 
					state={state} 
					isCurrent={index === currentIndex}
					isDone={index < currentIndex}
				/>
			))}
		</div>
	);

}

export default StateTracker;