import './primaryButton.css';

function Button({content, type, action, disabled, className}) {

  return(
    <button type={type} className={`primary-btn ${className}`} onClick={action} disabled={disabled}>
      {content}
    </button>
  );

}

export default Button;