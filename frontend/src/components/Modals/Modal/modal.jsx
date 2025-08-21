import './modal.css';

const Modal = ({id = null, title = "", show = false, setShow = null, children = null}) => {

	return(
		<div id={id} className={`overlay ${show ? 'd-flex justify-content-center align-items-center' : 'd-none'}`}>

      <div className='pop-up  d-flex flex-column gap-4'>

				<div className="d-flex flex-row justify-content-between gap-4">
					<h6>{title}</h6>
					<i className="bi bi-x-lg close" onClick={() => setShow(false)}></i>
				</div>

        {children}

      </div>

    </div>
	);

}

export default Modal;