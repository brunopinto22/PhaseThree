import './pill.css';

const Pill = ({type = "unset", text = null, color = null, collapse = false, className="", tooltip = null, tooltipPosition = "bottom"}) => {

	const types = ["unset", "Estágio", "Projeto", "Presencial", "Híbrido", "Remoto"];

	const typeColorMap = {
		"unset": "red",
		"Estágio": "teal",
		"Projeto": "pink",
		"Presencial": "red",
		"Híbrido": "orange",
		"Remoto": "blue"
	};

	const colors = [
		"darker-red", "darker-green", "darker-blue", "darker-orange", "darker-yellow", "darker-pink", "darker-purple", "darker-brown", "darker-teal",
		"red", "green", "blue", "orange", "yellow", "pink", "purple", "brown", "teal",
		"lighter-red", "lighter-green", "lighter-blue", "lighter-orange", "lighter-yellow", "lighter-pink", "lighter-purple", "lighter-brown", "lighter-teal",
	];

	const fallbackColor = typeColorMap[type] || "red";
	const col = colors.includes(color) ? color : fallbackColor;

	const txt = text || (types.includes(type) ? type : "unset");

	return (
		<div className={`pill ${col} ${className} ${tooltip ? `tooltip tooltip-${tooltipPosition}` : ""}`}>
			<p>{collapse ? txt[0] : txt}</p>
			{tooltip && <p className="tooltiptext">{tooltip}</p>}
		</div>
	);

}

export default Pill;