import './myCandidates.css';
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert } from '../../../../components';
import { listProposals, getProposalCandidates, acceptCandidate, rejectCandidate } from '../../../../services';
import { UserContext } from '../../../../contexts';
import CandidateCard from '../../../../components/CandidateCard/candidateCard';

function MyCandidates() {
  const navigate = useNavigate();
  const { userInfo } = useContext(UserContext);

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [proposals, setProposals] = useState([]);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [candidatesData, setCandidatesData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userInfo.role !== 'representative') {
      navigate('/');
      return;
    }
    fetchProposals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchProposals() {
    setLoading(true);
    const data = await listProposals(userInfo.token, () => {}, setError);
    if (data) {
      setProposals(data);
    }
    setLoading(false);
  }

  async function fetchCandidates(proposalId) {
    setLoading(true);
    setError('');
    const data = await getProposalCandidates(userInfo.token, proposalId, () => {}, setError);
    if (data) {
      setCandidatesData(data);
      setSelectedProposal(proposalId);
    }
    setLoading(false);
  }

  async function handleAccept(studentNumber) {
    setError('');
    setSuccessMessage('');
    const success = await acceptCandidate(userInfo.token, selectedProposal, studentNumber, () => {}, setError);
    if (success) {
      setSuccessMessage('Candidato aceite com sucesso!');
      // Recarregar candidatos
      await fetchCandidates(selectedProposal);
    }
  }

  async function handleReject(studentNumber) {
    setError('');
    setSuccessMessage('');
    const success = await rejectCandidate(userInfo.token, selectedProposal, studentNumber, () => {}, setError);
    if (success) {
      setSuccessMessage('Candidato rejeitado com sucesso!');
      // Recarregar candidatos
      await fetchCandidates(selectedProposal);
    }
  }

  function handleBackToProposals() {
    setSelectedProposal(null);
    setCandidatesData(null);
    setError('');
    setSuccessMessage('');
  }

  if (loading && proposals.length === 0) {
    return (
      <div className="my-candidates-container">
        <h2>A carregar...</h2>
      </div>
    );
  }

  return (
    <div className="my-candidates-container">
      <div className="my-candidates-header">
        <h1>Meus Candidatos</h1>
        {selectedProposal && (
          <button className="back-button" onClick={handleBackToProposals}>
            ← Voltar às Propostas
          </button>
        )}
      </div>

      {error && <Alert type="danger" text={error} />}
      {successMessage && <Alert type="success" text={successMessage} />}

      {!selectedProposal ? (
        <div className="proposals-list">
          <h2>Minhas Propostas</h2>
          {proposals.length === 0 ? (
            <p className="no-data">Não tem propostas registadas.</p>
          ) : (
            <div className="proposals-grid">
              {proposals.map((proposal) => (
                <div 
                  key={proposal.id} 
                  className="proposal-card"
                  onClick={() => fetchCandidates(proposal.id)}
                >
                  <h3>{proposal.title}</h3>
                  
                  <div className="proposal-metadata">
                    <div className="metadata-row">
                      <i className="bi bi-calendar3"></i>
                      <span className="metadata-label">{proposal.calendar.title}</span>
                    </div>
                    <div className="metadata-row">
                      <i className="bi bi-mortarboard-fill"></i>
                      <span className="metadata-label">{proposal.course.acronym}</span>
                    </div>
                    <div className="metadata-row">
                      <i className="bi bi-building"></i>
                      <span>{proposal.company.name}</span>
                    </div>
                    <div className="metadata-row">
                      <i className="bi bi-geo-alt-fill"></i>
                      <span>{proposal.location}</span>
                    </div>
                  </div>

                  <div className="proposal-timeline">
                    <h4>Prazos Importantes</h4>
                    <div className="timeline-item">
                      <span className="timeline-label">Candidaturas:</span>
                      <span className="timeline-date">até {proposal.calendar.candidatures}</span>
                    </div>
                    <div className="timeline-item">
                      <span className="timeline-label">Colocações:</span>
                      <span className="timeline-date">{proposal.calendar.placements}</span>
                    </div>
                  </div>
                  
                  <button className="view-candidates-btn">
                    Ver Candidatos →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="candidates-section">
          {candidatesData && (
            <>
              <div className="proposal-info">
                <h2>{candidatesData.proposal_title}</h2>
                <div className="proposal-info-grid">
                  <div className="info-section">
                    <h3>Vagas</h3>
                    <div className="slots-info">
                      <span className={candidatesData.accepted_count >= candidatesData.slots ? 'slots-full' : 'slots-available'}>
                        {candidatesData.accepted_count} / {candidatesData.slots} preenchidas
                      </span>
                      {candidatesData.accepted_count >= candidatesData.slots && (
                        <span className="warning-text"> (Vagas esgotadas)</span>
                      )}
                    </div>
                  </div>

                  <div className="info-section">
                    <h3>Prazos do Processo</h3>
                    <div className="dates-grid">
                      <div className="date-item">
                        <i className="bi bi-calendar-check"></i>
                        <div>
                          <strong>Candidaturas até</strong>
                          <span>{candidatesData.calendar.candidatures}</span>
                        </div>
                      </div>
                      <div className="date-item">
                        <i className="bi bi-calendar-event"></i>
                        <div>
                          <strong>Colocações</strong>
                          <span>{candidatesData.calendar.placements}</span>
                        </div>
                      </div>
                      <div className="date-item">
                        <i className="bi bi-megaphone"></i>
                        <div>
                          <strong>Divulgação</strong>
                          <span>{candidatesData.calendar.divulgation}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {candidatesData.candidates.length === 0 ? (
                <p className="no-data">Nenhum candidato se candidatou a esta proposta.</p>
              ) : (
                <div className="candidates-list">
                  {candidatesData.candidates.map((candidate) => (
                    <CandidateCard
                      key={candidate.student_number}
                      candidate={candidate}
                      onAccept={() => handleAccept(candidate.student_number)}
                      onReject={() => handleReject(candidate.student_number)}
                      slotsAvailable={candidatesData.accepted_count < candidatesData.slots}
                      loading={loading}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default MyCandidates;
