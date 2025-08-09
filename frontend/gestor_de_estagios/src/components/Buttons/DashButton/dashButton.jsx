import './dashButton.css';

function DashButton({icon = null, text = "null", action = null, disabled = false, className = ""}) {

	const handleClick = () => {
		if (typeof action === 'function') {
			action();
		} else {
			console.warn("DashButton['"+ text +"']: 'action' is not a function");
		}
	}

  return(
    <button className={'dash-btn ' + className} onClick={handleClick} disabled={disabled}>
      <div className='btn-icon'>{icon}</div><div className='btn-text'><h6>{text}</h6></div>
    </button>
  );

}

export default DashButton;