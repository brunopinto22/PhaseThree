import './secundaryButton.css';

function SecundaryButton({content, action, disabled, className}) {

  return(
    <button className={`secundary-btn ${className}`} onClick={action} disabled={disabled}>
      {content}
    </button>
  );

}

export default SecundaryButton;