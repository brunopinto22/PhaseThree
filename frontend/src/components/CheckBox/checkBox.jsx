import './checkBox.css';

const CheckBox = ({ label = null, value = null, setValue = null, disabled, error = false, className = "", disabledClick = false }) => {

	const handleChange = () => {
		if (disabled || !setValue || disabledClick) return;
		setValue(!value);
	};

	// Generate a simple ID for the input if the label is provided
	const inputId = typeof label === 'string' ? label.replace(/\s+/g, '-').toLowerCase() : undefined;

	return (
		<label htmlFor={inputId} className={`checkbox ${error ? 'error' : ''} ${disabledClick ? 'no-click' : ''} ${className}`}>
			<input
				id={inputId}
				type="checkbox"
				disabled={disabled}
				checked={value}
				onChange={handleChange}
			/>
			{label && (<span>{label}</span>)}
		</label>
	);

}

export default CheckBox;