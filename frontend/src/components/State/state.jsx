import './state.css';

const OptionButton = ({ state = 0, hideState = false, hideText = false, className = "", tooltip = false, tooltipPosition = "right" }) => {

	const iconMap = [
		"bi-question-circle",
		"bi-hourglass-split",
		"bi-check2",
		"bi-clipboard-check",
		"bi-clipboard-x",
		"bi-file-binary",
		"bi-journal-bookmark-fill",
		"bi-building-check",
		"bi-journal-check",
		"bi-rocket-fill",
		"bi-flag-fill",
	]

	const text = [
		"unset",
		"Pendente",
		"Colocado",
		"Aceite",
		"Rejeitado",
		"Protocolo Gerado",
		"Protocolo ISEC",
		"Protocolo Empresa",
		"Protocolo Aluno",
		"Em estágio",
		"Finalizado",
	]

	const btnClass = [
		"unset",
		"pending",
		"placed",
		"accepted",
		"rejected",
		"protocol-generated",
		"protocol-isec",
		"protocol-company",
		"protocol-student",
		"in-internship",
		"finished",
	]

	const stateMap = {
		'submitted': 1,
		'placed': 2,
		'accepted': 3,
		'rejected': 4,
		'protocol_generated': 5,
		'presidency_signature': 6,
		'company_signature': 7,
		'student_signature': 8,
		'in_internship': 9,
		'finished': 10,
	};

	return (
		<div className={`state - text ${btnClass[state]} ${tooltip ? `tooltip tooltip-${tooltipPosition}` : ""} ${className} `}>
			<i className={`bi ${iconMap[state]} `}></i>
			{!hideState && <b>Estado:</b>}
			{!hideText && <p>{text[state]}</p>}
			{tooltip && <p className="tooltiptext">{text[state]}</p>}
		</div>
	);

}

export default OptionButton;