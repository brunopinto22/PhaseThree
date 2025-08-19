import { useContext, useState } from "react";

import { PrimaryButtonSmall, SecundaryButtonSmall, TextInput } from './../../../components'
import { invite } from "../../../services";
import { UserContext } from "../../../contexts";

const InviteModal = ({show, setShow}) => {

	const { userInfo } = useContext(UserContext);
	const [email, setEmail] = useState("");
	const [errors, setErrors] = useState({ email: false });
	const [status, setStatus] = useState(null);
	const [error, setError] = useState(null);


	const submit = async () => {
		if(email === null || email === "") {
			setErrors(prev => ({ ...prev, email: true }));
			return;
		}
		
		await invite(userInfo.token, email, setStatus, setError)

		console.log("fdsads")
	}


	return(
		<div className={`overlay ${show ? 'd-flex justify-content-center align-items-center' : 'd-none'}`}>
      <div className='pop-up col-sm-11 col-md-6 d-flex flex-column gap-4'>

        <div className="d-flex flex-row justify-content-between gap-4">
          <h6>Convidar representante</h6>
          <i className="bi bi-x-lg close" onClick={() => setShow(false)}></i>
        </div>

				<TextInput text='Email' type='email' value={email} setValue={setEmail} error={errors.email} />

				<div className="d-flex flex-row gap-4">
					<PrimaryButtonSmall content={<p>Convidar</p>} action={submit} />
					<SecundaryButtonSmall content={<p>Cancelar</p>} action={() => { setEmail(null); setShow(false); }} />
				</div>

				{error && <p className={status === 200 ? "success-message" : "error-message"}>{error}</p>}

      </div>
    </div>
	);

}

export default InviteModal;