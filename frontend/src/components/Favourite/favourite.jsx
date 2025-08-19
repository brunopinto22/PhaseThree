import './favourite.css';

const Favourite = ({value = false, action = null, small = false, className = ""}) => {

	const click = () => {
		action();
	}

	return(
		<div className={`favourite-container ${small ? "small" : ""} ${value ? "fav" : ""} ${className}`} onClick={click}>
			<div className="favourite">
				{value ? <i class="bi bi-heart-fill"></i> : <i class="bi bi-heart"></i>}
			</div>
		</div>
	);

}

export default Favourite;