import './textInput.css';

function TextInput({ type = "" ,text = "input", value = null, disabled = false, error = false, setValue, className = "", tooltip = null  }) {

	const validTypes = ["text", "email", "number", "date"];
  const inputType = validTypes.includes(type.toLowerCase()) ? type : "text";
  
  const handleChange = (e) => {
    if (error)
      error = false;
    setValue?.(e.target.value);
  };

  return (
    <div className={`input ${disabled ? 'disabled' : ''} ${error ? 'error' : ''} ${className}`}>
      <label className='d-flex flex-row gap-1 align-items-center' htmlFor={text}>
				<b>{text}</b>
				{tooltip && (
					<div className="tooltip">
						<i className="bi bi-question-circle"></i>
						<p className="tooltiptext">{tooltip}</p>
					</div>
				)}
			</label>
      <input
        id={text}
        type={inputType}
        disabled={disabled}
        value={value}
        onChange={handleChange}
      />
    </div>
  );
}

export default TextInput;