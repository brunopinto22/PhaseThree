import './state.css';

const OptionButton = ({state = 0, hideState = false, hideText = false, className = ""}) => {

	const iconMap = [
		"bi-x",
		"bi-arrow-clockwise",
		"bi-check2",
		"bi-file-binary",
		"bi-journal-bookmark-fill",
		"bi-building-check",
		"bi-journal-check",
		"bi-rocket-fill",
	];
	
	const text = [
		"unset",
		"Pendente",
		"Colocado",
		"Protocolo Gerado",
		"Protocolo ISEC",
		"Protocolo Empresa",
		"Protocolo Aluno",
		"Em estágio",
	]

	const btnClass = [
		"unset",
		"pending",
		"accpeted",
		"protocol-generated",
		"protocol-isec",
		"protocol-company",
		"protocol-student",
		"start",
	];


	return(
		<div className={`state-text ${btnClass[state]} ${className}`}>
			<i className={`bi ${iconMap[state]}`}></i>
			{!hideState && <b>Estado:</b>}
			{!hideText && <p>{text[state]}</p>}
		</div>
	);

}

export default OptionButton;