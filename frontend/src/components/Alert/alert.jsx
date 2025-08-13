import './alert.css';

function Warning({text="No Warning Text Given", type="warning", small = false}) {

	if(text === null || text === "")
		text = "No Warning Text Given"

	const iconMap = {
    danger: "bi-exclamation-octagon",
    warning: "bi-exclamation-triangle",
    success: "bi-check-lg",
    info: "bi-info-circle",
  };

	const iconClass = iconMap[type] || iconMap["warning"];

	return(
		<div className={`d-flex align-items-center alert${small ? '-small' : ''} alert-${type}`}>
			<i className={`bi ${iconClass}`}></i>
			{small ? (<p>{text}</p>) : (<h6>{text}</h6>)}
		</div>
	);

}

export default Warning;