import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserContext } from '../../../../contexts/UserContext';
import { getTeacherSupervisedStudents } from '../../../../services/supervision';
import '../../../../styles/Pages/Modules/Orientation.css';

const TeacherOrientation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userInfo } = useContext(UserContext);
  
  const [supervisedStudents, setSupervisedStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    // Get token from localStorage
    const token = localStorage.getItem('access_token');
    
    if (!userInfo || !token) {
      navigate('/login');
      return;
    }

    if (userInfo.role !== 'teacher') {
      navigate('/');
      return;
    }

    loadSupervisedStudents();
  }, [userInfo, id, navigate]);

  const loadSupervisedStudents = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('access_token');
    const data = await getTeacherSupervisedStudents(
      id,
      token,
      setStatusMessage,
      setErrorMessage
    );

    if (data) {
      setSupervisedStudents(data.supervised_students || []);
    }
    setIsLoading(false);
  };

  const handleRefresh = () => {
    loadSupervisedStudents();
  };

  if (isLoading) {
    return (
      <div className="orientation-container">
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="orientation-container">
      <div className="orientation-header">
        <h1>Orientação de Estudantes</h1>
        <p className="subtitle">Estudantes sob sua supervisão como orientador ISEC</p>
      </div>

      {errorMessage && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {errorMessage}
          <button
            type="button"
            className="btn-close"
            onClick={() => setErrorMessage('')}
            aria-label="Close"
          ></button>
        </div>
      )}

      {statusMessage && (
        <div className="alert alert-info" role="alert">
          {statusMessage}
        </div>
      )}

      <div className="orientation-controls">
        <button
          className="btn btn-primary"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <i className="fas fa-sync-alt"></i> Atualizar
        </button>
      </div>

      {supervisedStudents.length === 0 ? (
        <div className="no-data-message">
          <i className="fas fa-inbox"></i>
          <p>Não tem estudantes supervisionados no momento</p>
        </div>
      ) : (
        <div className="students-grid">
          <h2 className="students-count">
            Total de Estudantes: <strong>{supervisedStudents.length}</strong>
          </h2>

          <div className="students-list">
            {supervisedStudents.map((item) => (
              <div key={item.candidature_id} className="student-card">
                <div className="card-header">
                  <div className="student-info">
                    <h3>{item.student.name}</h3>
                    <p className="student-number">Nº {item.student.number}</p>
                  </div>
                  <div className="status-badges">
                    <span className={`badge status-badge status-${item.candidature_state}`}>
                      {item.candidature_state === 'submitted' && 'Submetida'}
                      {item.candidature_state === 'placed' && 'Colocado'}
                      {item.candidature_state === 'accepted' && 'Aceite'}
                      {item.candidature_state === 'rejected' && 'Rejeitado'}
                      {item.candidature_state === 'revision' && 'Em Revisão'}
                      {item.candidature_state === 'protocol_generated' && 'Protocolo Gerado'}
                      {item.candidature_state === 'presidency_signature' && 'Assinatura ISEC'}
                      {item.candidature_state === 'company_signature' && 'Assinatura Empresa'}
                      {item.candidature_state === 'student_signature' && 'Assinatura Estudante'}
                      {item.candidature_state === 'in_internship' && 'Em Estágio'}
                      {item.candidature_state === 'finished' && 'Concluído'}
                    </span>
                  </div>
                </div>

                <div className="card-body">
                  <div className="info-row">
                    <label>Email:</label>
                    <span>{item.student.email}</span>
                  </div>

                  <div className="info-row">
                    <label>Curso:</label>
                    <span>{item.student.course || 'N/A'}</span>
                  </div>

                  <div className="info-row">
                    <label>Proposta:</label>
                    <span className="proposal-title">{item.proposal.title}</span>
                  </div>

                  <div className="info-row">
                    <label>Tipo de Proposta:</label>
                    <span>
                      {item.proposal.type === "1" && 'Estágio'}
                      {item.proposal.type === "2" && 'Projeto'}
                    </span>
                  </div>

                  <div className="info-row">
                    <label>Estado do Protocolo:</label>
                    <span className={`protocol-status status-${item.protocol_state}`}>
                      {item.protocol_state === 'pending' && 'Pendente'}
                      {item.protocol_state === 'accepted' && 'Aceite'}
                      {item.protocol_state === 'placed' && 'Colocado'}
                      {item.protocol_state === 'skipped' && 'Pulado'}
                      {item.protocol_state === 'rejected' && 'Rejeitado'}
                    </span>
                  </div>

                  {item.submission_date && (
                    <div className="info-row">
                      <label>Data de Submissão:</label>
                      <span>{new Date(item.submission_date).toLocaleDateString('pt-PT')}</span>
                    </div>
                  )}

                  {item.last_updated && (
                    <div className="info-row">
                      <label>Última Atualização:</label>
                      <span>{new Date(item.last_updated).toLocaleDateString('pt-PT')}</span>
                    </div>
                  )}
                </div>

                <div className="card-footer">
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => navigate(`/student/view?id=${item.student.id}`)}
                  >
                    Ver Perfil do Estudante
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherOrientation;
