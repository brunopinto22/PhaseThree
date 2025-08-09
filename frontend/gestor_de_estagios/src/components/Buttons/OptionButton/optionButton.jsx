import './optionButton.css';

const OptionButton = ({type = "disabled", action = null, disabled = false}) => {

	const iconMap = {
    disabled: "bi-dash-circle",
    view: "bi-eye",
    edit: "bi-pencil",
    delete: "bi-trash",
		remove: "bi-x",
    student: "bi-person",
    proposal: "bi-building",
  };

	const iconClass = iconMap[type] || iconMap["disabled"];
	const btnClass = type && type !== "" ? type : "disabled";
	const isDisabled = disabled || btnClass === "disabled";

	const handleClick = () => {
		if(!isDisabled)
			action();
	}

	return(
		<button className={`option-btn ${btnClass}`} disabled={isDisabled} onClick={handleClick}>
			<div className='d-flex justify-content-center align-items-center'><i className={`bi ${iconClass}`}></i></div>
		</button>
	);

}

export default OptionButton;