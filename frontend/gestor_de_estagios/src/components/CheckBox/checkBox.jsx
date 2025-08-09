import './checkBox.css';

const CheckBox = ({label = null, value = null, setValue = null, disabled, error = false, className = "", disabledClick = false}) => {

	const handleChange = () => {
    if (disabled || !setValue || disabledClick) return;
    setValue(!value);
  };

	return(
		<label htmlFor={label} className={`checkbox ${error ? 'error' : ''} ${disabledClick ? 'no-click' : ''} ${className}`}>
			<input id={label} type="checkbox" disabled={disabled} checked={value} onChange={handleChange} />
			{label && (<p>{label}</p>)}
		</label>
	);

}

export default CheckBox;