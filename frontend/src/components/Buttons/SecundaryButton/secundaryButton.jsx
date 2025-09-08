import './secundaryButton.css';

function SecundaryButton({content = null, small = false, type, action = () => {}, disabled = false, className = ""}) {

  return(
    <button className={`secundary-btn${small ? "-small" : ""} ${className}`} onClick={action} disabled={disabled}>
      {content}
    </button>
  );

}

export default SecundaryButton;