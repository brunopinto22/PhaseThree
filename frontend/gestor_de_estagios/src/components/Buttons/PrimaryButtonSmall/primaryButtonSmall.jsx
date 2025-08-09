import './primaryButtonSmall.css';

function PrimaryButtonSmall({content, action, disabled = false, className = "", style = null}) {

  return(
    <button style={style} className={`primary-btn-small ${className}`} onClick={action} disabled={disabled}>
      {content}
    </button>
  );

}

export default PrimaryButtonSmall;