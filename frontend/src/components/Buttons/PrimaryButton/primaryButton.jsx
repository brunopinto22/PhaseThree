import './primaryButton.css';

function Button({content = null, small = false, type, action = () => {}, disabled = false, className = ""}) {

  return(
    <button type={type} className={`primary-btn${small ? "-small" : ""} ${className}`} onClick={action} disabled={disabled}>
      {content}
    </button>
  );

}

export default Button;