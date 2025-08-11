import { useState } from 'react';
import './colorPicker.css'

const ColorPicker = ({color = "", setColor = null}) => {

	const colors = ["red", "green", "blue", "orange", "yellow", "pink", "purple", "brown", "teal"];
	const [selected, setSelected] = useState(color === "" ? 0 : colors.indexOf(color));

	const handleSelect = (index) => {
		setSelected(index);
		if(setColor == null) return;
		setColor(colors.at(index));
	}
	

	return(
		<div className="color-picker d-flex flex-row">
			{colors.map((clr, index)=>(
				<div key={index+"cp"} className={`color ${clr} ${selected === index ? 'selected' : ''}`} onClick={() => handleSelect(index)}></div>
			))}
		</div>
	);

}

export default ColorPicker;