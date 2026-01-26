import React from 'react';
import './historyTimeline.css';

const HistoryTimeline = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <div className="history-timeline-empty">
        <p>Nenhum histórico disponível</p>
      </div>
    );
  }

  const getStateLabel = (state) => {
    const labels = {
      'submitted': 'Submetida',
      'placed': 'Colocado Automaticamente',
      'accepted': 'Aceite pela Empresa',
      'rejected': 'Rejeitado',
      'revision': 'Em Revisão',
      'protocol_generated': 'Protocolo Gerado',
      'presidency_signature': 'Assinatura ISEC',
      'company_signature': 'Assinatura Empresa',
      'student_signature': 'Assinatura Aluno',
      'finished': 'Concluído'
    };
    return labels[state] || state;
  };

  const getStateIcon = (state) => {
    const icons = {
      'submitted': '📝',
      'placed': '🎯',
      'accepted': '✅',
      'rejected': '❌',
      'revision': '🔍',
      'protocol_generated': '📄',
      'presidency_signature': '🏛️',
      'company_signature': '🏢',
      'student_signature': '👤',
      'finished': '🎓'
    };
    return icons[state] || '•';
  };

  return (
    <div className="history-timeline">
      <h3>Histórico de Estados</h3>
      <div className="timeline-container">
        {history.map((entry, index) => (
          <div key={entry.id} className="timeline-entry">
            <div className="timeline-marker">
              <span className="timeline-icon">{getStateIcon(entry.new_state)}</span>
            </div>
            <div className="timeline-content">
              <div className="timeline-header">
                <span className="timeline-state">
                  {entry.old_state ? (
                    <>
                      {getStateLabel(entry.old_state)} → {getStateLabel(entry.new_state)}
                    </>
                  ) : (
                    <>{getStateLabel(entry.new_state)}</>
                  )}
                </span>
                <span className="timeline-date">{entry.changed_at}</span>
              </div>
              <div className="timeline-details">
                <span className="timeline-user">
                  Por: {entry.changed_by.email}
                </span>
                {entry.notes && (
                  <p className="timeline-notes">{entry.notes}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryTimeline;
