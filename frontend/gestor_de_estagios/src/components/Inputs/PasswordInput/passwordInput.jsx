import './passwordInput.css';
import { useState } from 'react';

function PasswordInput({ text="password", value = null, disabled = false, error = false, setValue, className = "", tooltip = null }) {
  
  const [hide, setHide] = useState(true);
  const toggle = () => {
    setHide(!hide);
  }

  const handleChange = (e) => {
    if (error)
      error = false;
    setValue?.(e.target.value);
  };

  return (
    <div className={`${error ? 'input error' : 'input'} ${className}`}>
			<label className='d-flex flex-row gap-1 align-items-center' htmlFor={text}>
				<b>{text}</b>
				{tooltip && (
					<div className="tooltip">
						<i className="bi bi-question-circle"></i>
						<p className="tooltiptext">{tooltip}</p>
					</div>
				)}
			</label>
      <div className="password">
        <input
          id={text}
          type={hide ? 'password' : 'text'}
          disabled={disabled}
          value={value}
          onChange={handleChange}
        />
        <div className='hide no-select' onClick={toggle}>
          <p>{hide ? (<i className='bi bi-eye'></i>) : (<i className='bi bi-eye-slash'></i>)}</p>
        </div>
      </div>
    </div>
  );
}

export default PasswordInput;