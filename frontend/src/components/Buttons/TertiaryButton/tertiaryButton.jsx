import './tertiaryButton.css';

function TertiaryButton({content, action, disabled}) {

  return(
    <button className='tertiary-btn' onClick={action} disabled={disabled}>
      {content}
    </button>
  );

}

export default TertiaryButton;