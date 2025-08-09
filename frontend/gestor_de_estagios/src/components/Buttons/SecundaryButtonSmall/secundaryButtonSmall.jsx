import './secundaryButtonSmall.css';

function SecundaryButtonSmall({content, action, disabled}) {

  return(
    <button className='secundary-btn-small' onClick={action} disabled={disabled}>
      {content}
    </button>
  );

}

export default SecundaryButtonSmall;