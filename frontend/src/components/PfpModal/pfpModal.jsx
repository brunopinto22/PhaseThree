import './pfpModal.css';
import { useContext, useState, useEffect } from 'react';
import { changePfp } from '../../services/user.js';
import { UserContext } from '../../contexts/UserContext.jsx';
import { PrimaryButtonSmall } from '../Buttons/index.js';

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
    <div id="pfp-changer" className={`overlay ${show ? 'd-flex justify-content-center align-items-center' : 'd-none'}`}>
      <div className='pop-up  d-flex flex-column gap-4'>
        <div className="d-flex flex-row justify-content-between gap-4">
          <h6>Alterar Foto de Perfil</h6>
          <i className="bi bi-x-lg close" onClick={() => setShow(false)}></i>
        </div>

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
      </div>
    </div>
  );
};

export default PfpModal;
