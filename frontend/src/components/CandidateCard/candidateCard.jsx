import './candidateCard.css';
import React from 'react';

function CandidateCard({ candidate, onAccept, onReject, slotsAvailable, loading }) {
  
  const getStateBadge = (state) => {
    const badges = {
      'pending': { label: 'Pendente', className: 'badge-pending' },
      'accepted': { label: 'Aceite', className: 'badge-accepted' },
      'rejected': { label: 'Rejeitado', className: 'badge-rejected' }
    };
    return badges[state] || badges['pending'];
  };

  const badge = getStateBadge(candidate.state);
  const canAccept = candidate.can_change && (candidate.state === 'pending' || candidate.state === 'rejected');
  const canReject = candidate.can_change && (candidate.state === 'pending' || candidate.state === 'accepted');

  return (
    <div className="candidate-card">
      <div className="candidate-header">
        <div className="candidate-info">
          <h3>{candidate.student_name}</h3>
          <p className="student-number">#{candidate.student_number}</p>
        </div>
        <span className={`state-badge ${badge.className}`}>
          {badge.label}
        </span>
      </div>

      <div className="candidate-details">
        <div className="detail-row">
          <i className="bi bi-envelope"></i>
          <span>{candidate.student_email}</span>
        </div>
        
        {candidate.course && (
          <div className="detail-row">
            <i className="bi bi-mortarboard"></i>
            <span>{candidate.course}</span>
          </div>
        )}
        
        {candidate.branch && (
          <div className="detail-row">
            <i className="bi bi-diagram-3"></i>
            <span>{candidate.branch}</span>
          </div>
        )}
        
        <div className="detail-row">
          <i className="bi bi-calendar-event"></i>
          <span>Submetido em: {candidate.submission_date}</span>
        </div>
      </div>

      <div className="candidate-actions">
        {candidate.curriculum_url && (
          <a 
            href={candidate.curriculum_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="curriculum-link"
          >
            <i className="bi bi-file-pdf"></i>
            Ver Currículo
          </a>
        )}

        {canAccept && (
          <div className="action-buttons">
            <button 
              className="btn-accept"
              onClick={onAccept}
              disabled={loading || !slotsAvailable}
              title={!slotsAvailable ? 'Sem vagas disponíveis' : candidate.state === 'rejected' ? 'Aceitar candidato (reverter rejeição)' : 'Aceitar candidato'}
            >
              <i className="bi bi-check-circle"></i>
              {candidate.state === 'rejected' ? 'Reverter Rejeição' : 'Aceitar'}
            </button>
            {candidate.state === 'pending' && (
              <button 
                className="btn-reject"
                onClick={onReject}
                disabled={loading}
              >
                <i className="bi bi-x-circle"></i>
                Rejeitar
              </button>
            )}
          </div>
        )}

        {canReject && candidate.state === 'accepted' && (
          <div className="action-buttons">
            <button 
              className="btn-reject"
              onClick={onReject}
              disabled={loading}
            >
              <i className="bi bi-x-circle"></i>
              Reverter Aceitação
            </button>
          </div>
        )}

        {!candidate.can_change && (
          <p className="period-closed">Período de seleção encerrado</p>
        )}

        {!slotsAvailable && canAccept && candidate.state !== 'accepted' && (
          <p className="slots-warning">Vagas esgotadas - rejeite um candidato aceite para liberar vaga</p>
        )}
      </div>
    </div>
  );
}

export default CandidateCard;
