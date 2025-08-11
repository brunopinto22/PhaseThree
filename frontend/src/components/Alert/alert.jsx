import './alert.css';

function Warning({text="No Warning Text Given", type="warning"}) {

	const iconMap = {
    danger: "bi-exclamation-octagon",
    warning: "bi-exclamation-triangle",
    success: "bi-check-lg",
    info: "bi-info-circle",
  };

	const iconClass = iconMap[type] || iconMap["warning"];

	return(
		<div className={`d-flex align-items-center alert alert-${type}`}>

			<i className={`bi ${iconClass}`}></i>
			
			<h6>{text}</h6>
		</div>
	);

}

export default Warning;