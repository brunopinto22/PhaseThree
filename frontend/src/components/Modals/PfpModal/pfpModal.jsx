import './pfpModal.css';
import { useContext, useState, useEffect } from 'react';
import { changePfp } from '../../../services/user.js';
import { UserContext } from '../../../contexts/UserContext.jsx';
import { PrimaryButtonSmall } from '../../Buttons/index.js';
import Modal from '../Modal/modal.jsx';

const PfpModal = ({ show, setShow, email}) => {
  const { userInfo } = useContext(UserContext);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!selectedFile) {
      setPreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  const handleUpload = async () => {
    if (!selectedFile) return;
    if(await changePfp(userInfo.token, email, selectedFile, setStatus, setError))
			setShow(false);
  };

  return (
    <Modal id='pfp-changer' title='Alterar Foto de Perfil' show={show} setShow={setShow}>

			{preview && (
				<div className="preview-container">
					<img src={preview} alt="Preview" className="img-fluid" />
				</div>
			)}

			<input
				type="file"
				accept="image/*"
				onChange={(e) => setSelectedFile(e.target.files[0])}
			/>

			<PrimaryButtonSmall action={handleUpload} content={<p>Guardar</p>} />

			{error && <p className="text-danger">{error}</p>}
		</Modal>
  );
};

export default PfpModal;
