import './decide.css';
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Alert } from '../../../../components';
import { getProposalCandidates, acceptCandidate, rejectCandidate } from '../../../../services';
import { UserContext } from '../../../../contexts';
import CandidateCard from '../../../../components/CandidateCard/candidateCard';

function Decide() {
  const navigate = useNavigate();
  const { userInfo } = useContext(UserContext);
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [candidatesData, setCandidatesData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userInfo.role !== 'representative') {
      navigate('/');
      return;
    }
    if (!id) {
      navigate('/pagenotfound');
      return;
    }
    fetchCandidates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, userInfo]);

  async function fetchCandidates() {
    setLoading(true);
    setError('');
    const data = await getProposalCandidates(userInfo.token, id, () => {}, setError);
    if (data) {
      setCandidatesData(data);
    }
    setLoading(false);
  }

  async function handleAccept(studentNumber) {
    setError('');
    setSuccessMessage('');
    const success = await acceptCandidate(userInfo.token, id, studentNumber, () => {}, setError);
    if (success) {
      setSuccessMessage('Candidato aceite com sucesso!');
      await fetchCandidates();
    }
  }

  async function handleReject(studentNumber) {
    setError('');
    setSuccessMessage('');
    const success = await rejectCandidate(userInfo.token, id, studentNumber, () => {}, setError);
    if (success) {
      setSuccessMessage('Candidato rejeitado com sucesso!');
      await fetchCandidates();
    }
  }

  if (!candidatesData) {
    return (
      <div className="decide-container">
        <h2>A carregar...</h2>
      </div>
    );
  }

  return (
    <div className="decide-container">
      <div className="header">
        <h2>Gerir Candidatos - {candidatesData.proposal_title}</h2>
        <button className="back-button" onClick={() => navigate('/proposal/view?id=' + id)}>← Voltar à Proposta</button>
      </div>

      {error && <Alert type="danger" text={error} />}
      {successMessage && <Alert type="success" text={successMessage} />}

      <div className="proposal-summary">
        <p><strong>Vagas:</strong> {candidatesData.slots}</p>
        <p><strong>Colocados:</strong> {candidatesData.placed_count || 0}</p>
        <p><strong>Aceitos:</strong> {candidatesData.accepted_count}</p>
      </div>

      {candidatesData.candidates.length === 0 ? (
        <div className="no-data">
          <p>Nenhum aluno foi colocado nesta proposta.</p>
        </div>
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
    </div>
  );
}

export default Decide;
