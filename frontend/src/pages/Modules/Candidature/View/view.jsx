import './view.css';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect, useContext } from 'react';
import { PrimaryButton, SecundaryButton, Alert, ProposalCard, StateTracker } from '../../../../components';
import { getCandidature } from '../../../../services';
import { generateProtocol, signProtocol, downloadProtocol, getProtocol } from '../../../../services/academic';
import { UserContext } from '../../../../contexts';

function View() {

	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
	const { userInfo } = useContext(UserContext);
	const token = userInfo?.token;
	const type = userInfo?.role;

	const [candidature, setCandidature] = useState(null);
	const [protocol, setProtocol] = useState(null);
	const [loading, setLoading] = useState(true);
	const [actionLoading, setActionLoading] = useState(false);
	const [status, setStatus] = useState(null);
	const [errorMessage, setErrorMessage] = useState("");
	const [successMessage, setSuccessMessage] = useState("");

	const [seeP, setSeeP] = useState(true);

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			const data = await getCandidature(token, id, setStatus, setErrorMessage);
			if (data) {
				setCandidature(data);
				// If there's a protocol, fetch its details
				if (data.protocol_id) {
					const protocolData = await getProtocol(token, data.protocol_id, setStatus, setErrorMessage);
					if (protocolData) {
						setProtocol(protocolData);
					}
				}
			}
			setLoading(false);
		};
		if (id) fetchData();
	}, [token, id]);

	const handleGenerateProtocol = async () => {
		setActionLoading(true);
		setErrorMessage("");
		setSuccessMessage("");
		const result = await generateProtocol(token, id, setStatus, setErrorMessage);
		if (result) {
			setSuccessMessage(`Protocolo ${result.protocol_number} gerado com sucesso!`);
			// Refresh candidature data
			const data = await getCandidature(token, id, setStatus, setErrorMessage);
			if (data) {
				setCandidature(data);
				if (data.protocol_id) {
					const protocolData = await getProtocol(token, data.protocol_id, setStatus, setErrorMessage);
					if (protocolData) setProtocol(protocolData);
				}
			}
		}
		setActionLoading(false);
	};

	const handleSignProtocol = async (signatureType) => {
		if (!protocol) return;
		setActionLoading(true);
		setErrorMessage("");
		setSuccessMessage("");
		const result = await signProtocol(token, protocol.id, signatureType, setStatus, setErrorMessage);
		if (result) {
			setSuccessMessage(`Protocolo assinado com sucesso!`);
			// Refresh data
			const data = await getCandidature(token, id, setStatus, setErrorMessage);
			if (data) {
				setCandidature(data);
				if (data.protocol_id) {
					const protocolData = await getProtocol(token, data.protocol_id, setStatus, setErrorMessage);
					if (protocolData) setProtocol(protocolData);
				}
			}
		}
		setActionLoading(false);
	};

	const handleDownloadProtocol = async () => {
		if (!protocol) return;
		try {
			await downloadProtocol(token, protocol.id);
		} catch (error) {
			setErrorMessage('Erro ao descarregar protocolo');
		}
	};

	// Map candidature state to StateTracker number
	const stateMap = {
		'submitted': 1,
		'revision': 1,
		'placed': 2,
		'protocol_generated': 3,
		'presidency_signature': 4,
		'company_signature': 5,
		'student_signature': 6,
		'finished': 7,
	};

	if (loading) {
		return (
			<div id='candidature' className='d-flex flex-column'>
				<Alert text='A carregar...' type='info' />
			</div>
		);
	}

	if (errorMessage || !candidature) {
		return (
			<div id='candidature' className='d-flex flex-column'>
				<Alert text={errorMessage || "Candidatura não encontrada"} type='danger' />
			</div>
		);
	}

	const { student, proposals, state, calendar, can_edit } = candidature;
	const stateNumber = stateMap[state] || 1;
	
	// Find accepted proposal if any
	const acceptedProposal = proposals.find(p => p.state === 'accepted');

	const parts = student.name.trim().split(" ");
	const shortName = parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1]}` : student.name;

	return (
		<div id='candidature' className='d-flex flex-column'>

			<div className="header d-flex flex-column">
				<h3 className='title'>Estado da Candidatura</h3>
				{acceptedProposal && (
					<h6>
						{acceptedProposal.title}{' '}
						<span className='text-link' onClick={() => navigate("/proposal/view?id=" + acceptedProposal.id)}>
							@{acceptedProposal.company.name}
						</span>
					</h6>
				)}
				<h6 className='sub-title text-link' onClick={() => navigate("/student/view?id=" + student.number)}>
					{shortName} nº{student.number}
				</h6>
			</div>

			<StateTracker currentState={stateNumber} />

			<div className='proposals d-flex flex-column gap-4'>
				<div className="d-flex flex-row align-content-center">
					<h4 className='d-flex flex-row align-items-center gap-2 noselect' style={{ cursor: "pointer" }} onClick={() => setSeeP(!seeP)}>
						<i className={`toggle-collapse bi bi-chevron-down`} style={{ transform: `rotateZ(${seeP ? "0" : "-90deg"})` }}></i>
						<span>Propostas ({proposals.length})</span>
					</h4>
				</div>
				<div className={`collapsible ${seeP ? "" : "collapse"}`}>
					{proposals.length === 0 ? (
						<Alert text='Nenhuma proposta selecionada' type='warning' />
					) : (
					<div className="d-flex flex-wrap gap-3">
							{proposals.map(p => (
								<ProposalCard 
									key={p.id}
									id={p.id}
									title={p.title}
									company={p.company.name}
									slots={p.slots}
									taken={p.taken}
									state={p.state}
								/>
							))}
					</div>
					)}
				</div>
			</div>

			<div className="info-section">
				<p><strong>Calendário:</strong> {calendar.title}</p>
				<p><strong>Limites:</strong> {calendar.min_proposals} a {calendar.max_proposals} propostas</p>
				<p><strong>Data de submissão:</strong> {candidature.submission_date}</p>
			</div>

			{/* Protocol Section - REQ-7 */}
			{(state === 'placed' || state === 'protocol_generated' || state === 'presidency_signature' || 
			  state === 'company_signature' || state === 'student_signature' || state === 'finished') && (
				<div className="protocol-section">
					<h4><i className="bi bi-file-earmark-text me-2"></i>Protocolo</h4>
					
					{successMessage && <Alert text={successMessage} type='success' />}
					{errorMessage && <Alert text={errorMessage} type='danger' />}
					
					{state === 'placed' && !protocol && (type === 'admin' || type === 'teacher') && (
						<div className="protocol-action">
							<p>A candidatura foi colocada. Pode agora gerar o protocolo de estágio.</p>
							<PrimaryButton 
								content="Gerar Protocolo" 
								action={handleGenerateProtocol}
								disabled={actionLoading}
							/>
						</div>
					)}
					
					{protocol && (
						<div className="protocol-details">
							<div className="protocol-info">
								<p><strong>Número do Protocolo:</strong> {protocol.protocol_number}</p>
								<p><strong>Ano Letivo:</strong> {protocol.academic_year}</p>
								<p><strong>Gerado em:</strong> {new Date(protocol.generated_at).toLocaleDateString('pt-PT')}</p>
							</div>
							
							<div className="protocol-signatures">
								<h5>Estado das Assinaturas</h5>
								<div className="signatures-grid">
									<div className={`signature-item ${protocol.signatures?.isec?.signed ? 'signed' : ''}`}>
										<span className="signature-label">ISEC</span>
										{protocol.signatures?.isec?.signed ? (
											<span className="signature-status">
												<i className="bi bi-check-circle-fill text-success"></i>
												{protocol.signatures.isec.signed_at && (
													<small>{new Date(protocol.signatures.isec.signed_at).toLocaleDateString('pt-PT')}</small>
												)}
											</span>
										) : (
											<span className="signature-status pending">
												<i className="bi bi-clock text-warning"></i> Pendente
											</span>
										)}
									</div>
									<div className={`signature-item ${protocol.signatures?.company?.signed ? 'signed' : ''}`}>
										<span className="signature-label">Empresa</span>
										{protocol.signatures?.company?.signed ? (
											<span className="signature-status">
												<i className="bi bi-check-circle-fill text-success"></i>
												{protocol.signatures.company.signed_at && (
													<small>{new Date(protocol.signatures.company.signed_at).toLocaleDateString('pt-PT')}</small>
												)}
											</span>
										) : (
											<span className="signature-status pending">
												<i className="bi bi-clock text-warning"></i> Pendente
											</span>
										)}
									</div>
									<div className={`signature-item ${protocol.signatures?.student?.signed ? 'signed' : ''}`}>
										<span className="signature-label">Estudante</span>
										{protocol.signatures?.student?.signed ? (
											<span className="signature-status">
												<i className="bi bi-check-circle-fill text-success"></i>
												{protocol.signatures.student.signed_at && (
													<small>{new Date(protocol.signatures.student.signed_at).toLocaleDateString('pt-PT')}</small>
												)}
											</span>
										) : (
											<span className="signature-status pending">
												<i className="bi bi-clock text-warning"></i> Pendente
											</span>
										)}
									</div>
								</div>
							</div>
							
							<div className="protocol-actions d-flex gap-2 mt-3">
								{protocol.has_document && (
									<SecundaryButton 
										content="Descarregar Protocolo" 
										action={handleDownloadProtocol}
									/>
								)}
								
								{/* Sign buttons based on state and user role */}
								{state === 'protocol_generated' && (type === 'admin' || type === 'teacher') && (
									<PrimaryButton 
										content="Assinar (ISEC)" 
										action={() => handleSignProtocol('isec')}
										disabled={actionLoading}
									/>
								)}
								{state === 'presidency_signature' && (type === 'admin' || type === 'representative') && (
									<PrimaryButton 
										content="Assinar (Empresa)" 
										action={() => handleSignProtocol('company')}
										disabled={actionLoading}
									/>
								)}
								{state === 'company_signature' && (type === 'admin' || type === 'student') && (
									<PrimaryButton 
										content="Assinar (Estudante)" 
										action={() => handleSignProtocol('student')}
										disabled={actionLoading}
									/>
								)}
							</div>
						</div>
					)}
				</div>
			)}

			{can_edit && (type === 'admin' || type === 'teacher') && (
				<div className="col">
					<PrimaryButton content={<h6>Editar Candidatura</h6>} action={() => navigate("/candidature/edit?id=" + id)} />
				</div>
			)}

		</div>
	);

}

export default View;
