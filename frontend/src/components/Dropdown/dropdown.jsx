import './dropdown.css';

const Dropdown = ({ children = null, text = "input", disabled = false, error = false, value="", setValue, className = "", placeholder = "Selecione uma opção", tooltip = null }) => {

	const handleChange = (e) => {
		const value = e.target.value;
		setValue && setValue(value);
	};

	return(
		<div className={`input ${error ? 'error' : ''} ${className} ${disabled ? 'disabled' : ''}`}>
			<label className='d-flex flex-row gap-1 align-items-center' htmlFor={text}>
				<b>{text}</b>
				{tooltip && (
					<div className="tooltip">
						<i className="bi bi-question-circle"></i>
						<p className="tooltiptext">{tooltip}</p>
					</div>
				)}
			</label>
			<select name={text} disabled={disabled} onChange={handleChange} value={value || ""}>
				<option value="" default selected disabled hidden>{placeholder}</option>
				{children}
			</select>
		</div>
	);

}

export default Dropdown;