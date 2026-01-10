import './dashboard.css';
import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, State, OptionButton, PrimaryButton } from '../../../../components';
import { getAcademicDashboard, getAcademicPlacements, getPendingActions, generateProtocol, signProtocol, exportPlacements, downloadProtocol, getPendingRegistrations, validateStudentRegistration } from '../../../../services/academic';
import { UserContext } from '../../../../contexts';

const AcademicDashboard = () => {
    const navigate = useNavigate();
    const { userInfo } = useContext(UserContext);
    const token = userInfo?.token;

    const [dashboard, setDashboard] = useState(null);
    const [placements, setPlacements] = useState([]);
    const [pendingActions, setPendingActions] = useState([]);
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [activeTab, setActiveTab] = useState('overview');
    const [stateFilter, setStateFilter] = useState('');
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setErrorMessage("");
            
            // Fetch dashboard data
            const dashboardData = await getAcademicDashboard(token, setStatus, setErrorMessage);
            if (dashboardData) {
                setDashboard(dashboardData);
            }

            // Fetch pending actions
            const actionsData = await getPendingActions(token, setStatus, setErrorMessage);
            if (actionsData) {
                setPendingActions(actionsData.actions || []);
            }

            setLoading(false);
        };
        fetchData();
    }, [token]);

    useEffect(() => {
        const fetchPlacements = async () => {
            if (activeTab === 'placements') {
                const filters = stateFilter ? { state: stateFilter } : {};
                const data = await getAcademicPlacements(token, filters, setStatus, setErrorMessage);
                if (data) {
                    setPlacements(data);
                }
            } else if (activeTab === 'registrations') {
                const data = await getPendingRegistrations(token, setStatus, setErrorMessage);
                if (data) {
                    setRegistrations(data.registrations || []);
                }
            }
        };
        fetchPlacements();
    }, [activeTab, stateFilter, token]);

    const handleGenerateProtocol = async (candidatureId) => {
        setActionLoading(candidatureId);
        setErrorMessage("");
        const result = await generateProtocol(token, candidatureId, setStatus, setErrorMessage);
        if (result) {
            // Refresh placements
            const data = await getAcademicPlacements(token, { state: stateFilter }, setStatus, setErrorMessage);
            if (data) setPlacements(data);
            alert(`Protocolo ${result.protocol_number} gerado com sucesso!`);
        }
        setActionLoading(null);
    };

    const handleSignProtocol = async (protocolId, signatureType) => {
        setActionLoading(protocolId);
        setErrorMessage("");
        const result = await signProtocol(token, protocolId, signatureType, setStatus, setErrorMessage);
        if (result) {
            // Refresh placements
            const data = await getAcademicPlacements(token, { state: stateFilter }, setStatus, setErrorMessage);
            if (data) setPlacements(data);
            alert('Protocolo assinado com sucesso!');
        }
        setActionLoading(null);
    };

    const handleExport = async () => {
        try {
            await exportPlacements(token, { state: stateFilter });
        } catch (error) {
            setErrorMessage('Erro ao exportar dados');
        }
    };

    const handleDownloadProtocol = async (protocolId) => {
        try {
            await downloadProtocol(token, protocolId);
        } catch (error) {
            setErrorMessage('Erro ao descarregar protocolo');
        }
    };

    const StatCard = ({ title, value, icon, color, onClick }) => (
        <div className={`stat-card ${color}`} onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
            <div className="stat-icon">{icon}</div>
            <div className="stat-content">
                <h3>{value}</h3>
                <p>{title}</p>
            </div>
        </div>
    );

    const ActionCard = ({ action }) => (
        <div className={`action-card priority-${action.priority}`}>
            <div className="action-icon">
                {action.priority === 'high' && <i className="bi bi-exclamation-triangle-fill"></i>}
                {action.priority === 'medium' && <i className="bi bi-exclamation-circle-fill"></i>}
                {action.priority === 'low' && <i className="bi bi-info-circle-fill"></i>}
            </div>
            <div className="action-content">
                <h5>{action.title}</h5>
                <p>{action.description}</p>
            </div>
            <div className="action-badge">
                <span className="badge bg-secondary">{action.count}</span>
            </div>
        </div>
    );

    const PlacementRow = ({ placement }) => {
        const getActionButton = () => {
            switch (placement.state) {
                case 'placed':
                    return (
                        <PrimaryButton 
                            content="Gerar Protocolo" 
                            action={() => handleGenerateProtocol(placement.id)}
                            disabled={actionLoading === placement.id}
                        />
                    );
                case 'awaiting_signatures':
                    // Show pending signatures
                    const protocol = placement.protocol;
                    if (!protocol?.company_signed) {
                        return <span className="badge bg-warning">Aguarda Empresa</span>;
                    }
                    if (!protocol?.student_signed) {
                        return <span className="badge bg-info">Aguarda Estudante</span>;
                    }
                    return <span className="badge bg-success">Assinaturas Completas</span>;
                case 'finished':
                    return (
                        <PrimaryButton 
                            content="Ver Protocolo" 
                            action={() => handleDownloadProtocol(placement.protocol?.id)}
                            disabled={!placement.protocol}
                        />
                    );
                // Legacy states (backwards compatibility)
                case 'protocol_generated':
                case 'presidency_signature':
                case 'company_signature':
                case 'student_signature':
                    return (
                        <PrimaryButton 
                            content="Ver Protocolo" 
                            action={() => handleDownloadProtocol(placement.protocol?.id)}
                            disabled={!placement.protocol}
                        />
                    );
                default:
                    return null;
            }
        };

        return (
            <tr className="table-row">
                <td className="fit-column text-center">{placement.student?.number}</td>
                <td>{placement.student?.name}</td>
                <td>{placement.proposal?.title || 'N/A'}</td>
                <td>{placement.proposal?.company || 'ISEC'}</td>
                <td><State state={placement.state} hideState={true} tooltip={true} /></td>
                <td>{placement.protocol?.number || '-'}</td>
                <td className="d-flex gap-2">
                    <OptionButton type="view" action={() => navigate(`/candidature/view?id=${placement.id}`)} />
                    {getActionButton()}
                </td>
            </tr>
        );
    };

    if (loading) {
        return (
            <div className="academic-dashboard">
                <div className="top d-flex flex-row justify-content-between">
                    <div className="title"><h4>Serviços Académicos</h4></div>
                </div>
                <Alert text="A carregar..." type="info" />
            </div>
        );
    }

    return (
        <div className="academic-dashboard">
            <div className="top d-flex flex-row justify-content-between align-items-center">
                <div className="title"><h4>Serviços Académicos</h4></div>
                <div className="tabs d-flex gap-2">
                    <button 
                        className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        <i className="bi bi-grid-fill me-2"></i>Visão Geral
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'placements' ? 'active' : ''}`}
                        onClick={() => setActiveTab('placements')}
                    >
                        <i className="bi bi-people-fill me-2"></i>Colocações
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'registrations' ? 'active' : ''}`}
                        onClick={() => setActiveTab('registrations')}
                    >
                        <i className="bi bi-person-check-fill me-2"></i>Registos
                    </button>
                </div>
            </div>

            {errorMessage && <Alert text={errorMessage} type="danger" />}

            {activeTab === 'overview' && dashboard && (
                <div className="overview-content">
                    {/* Stats Cards */}
                    <div className="stats-grid">
                        <StatCard 
                            title="Total Estudantes"
                            value={dashboard.overview.total_students}
                            icon={<i className="bi bi-people-fill"></i>}
                            color="primary"
                        />
                        <StatCard 
                            title="Estágios Ativos"
                            value={dashboard.overview.active_internships}
                            icon={<i className="bi bi-briefcase-fill"></i>}
                            color="success"
                        />
                        <StatCard 
                            title="Concluídos"
                            value={dashboard.overview.finished_internships}
                            icon={<i className="bi bi-check-circle-fill"></i>}
                            color="info"
                        />
                        <StatCard 
                            title="Total Propostas"
                            value={dashboard.overview.total_proposals}
                            icon={<i className="bi bi-file-earmark-text-fill"></i>}
                            color="secondary"
                        />
                    </div>

                    {/* Pending Signatures - simplified (ISEC auto-signs on generation) */}
                    {dashboard.pending_signatures.total > 0 && (
                        <div className="signatures-section mt-4">
                            <h5><i className="bi bi-pen-fill me-2"></i>Assinaturas Pendentes</h5>
                            <div className="signatures-grid">
                                <div className="signature-card" onClick={() => { setStateFilter('awaiting_signatures'); setActiveTab('placements'); }}>
                                    <span className="signature-count">{dashboard.pending_signatures.company}</span>
                                    <span className="signature-label">Empresa</span>
                                </div>
                                <div className="signature-card" onClick={() => { setStateFilter('awaiting_signatures'); setActiveTab('placements'); }}>
                                    <span className="signature-count">{dashboard.pending_signatures.student}</span>
                                    <span className="signature-label">Estudante</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Pending Actions */}
                    {pendingActions.length > 0 && (
                        <div className="actions-section mt-4">
                            <h5><i className="bi bi-bell-fill me-2"></i>Ações Pendentes</h5>
                            <div className="actions-list">
                                {pendingActions.map((action, idx) => (
                                    <ActionCard key={idx} action={action} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Candidature States Distribution */}
                    <div className="states-section mt-4">
                        <h5><i className="bi bi-bar-chart-fill me-2"></i>Distribuição por Estado</h5>
                        <div className="states-grid">
                            {Object.entries(dashboard.candidatures_by_state).map(([state, count]) => (
                                <div 
                                    key={state} 
                                    className="state-item"
                                    onClick={() => { setStateFilter(state); setActiveTab('placements'); }}
                                >
                                    <State state={state} hideState={true} />
                                    <span className="state-count">{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Activity */}
                    {dashboard.recent_activity.length > 0 && (
                        <div className="activity-section mt-4">
                            <h5><i className="bi bi-clock-history me-2"></i>Atividade Recente</h5>
                            <div className="activity-list">
                                {dashboard.recent_activity.slice(0, 5).map((activity) => (
                                    <div key={activity.id} className="activity-item">
                                        <div className="activity-icon">
                                            <State state={activity.new_state} hideText={true} />
                                        </div>
                                        <div className="activity-content">
                                            <strong>{activity.student_name}</strong>
                                            <span className="activity-transition">
                                                {activity.previous_state && `${activity.previous_state} → `}{activity.new_state}
                                            </span>
                                            {activity.notes && <small className="activity-notes">{activity.notes}</small>}
                                        </div>
                                        <div className="activity-time">
                                            {new Date(activity.changed_at).toLocaleDateString('pt-PT')}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Calendars */}
                    {dashboard.calendars.length > 0 && (
                        <div className="calendars-section mt-4">
                            <h5><i className="bi bi-calendar3 me-2"></i>Calendários</h5>
                            <div className="calendars-grid">
                                {dashboard.calendars.map((cal) => (
                                    <div 
                                        key={cal.id} 
                                        className="calendar-card"
                                        onClick={() => navigate(`/calendar/view?id=${cal.id}`)}
                                    >
                                        <h6>{cal.year}/{cal.year + 1} - {cal.semester}º Sem</h6>
                                        <p className="calendar-course">{cal.course}</p>
                                        <div className="calendar-stats">
                                            <span><i className="bi bi-people"></i> {cal.students}</span>
                                            <span><i className="bi bi-file-earmark"></i> {cal.proposals}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'placements' && (
                <div className="placements-content">
                    <div className="placements-header d-flex justify-content-between align-items-center mb-3">
                        <div className="filters d-flex gap-2 align-items-center">
                            <label>Filtrar por estado:</label>
                            <select 
                                value={stateFilter} 
                                onChange={(e) => setStateFilter(e.target.value)}
                                className="form-select form-select-sm"
                            >
                                <option value="">Todos</option>
                                <option value="placed">Colocado</option>
                                <option value="awaiting_signatures">Aguarda Assinaturas</option>
                                <option value="finished">Concluído</option>
                            </select>
                        </div>
                        <PrimaryButton content="Exportar CSV" action={handleExport} />
                    </div>

                    {placements.length === 0 ? (
                        <Alert text="Nenhuma colocação encontrada com os filtros selecionados" type="info" />
                    ) : (
                        <table className="placements-table">
                            <thead>
                                <tr className="header">
                                    <th className="fit-column">Nº Aluno</th>
                                    <th>Nome</th>
                                    <th>Proposta</th>
                                    <th>Empresa</th>
                                    <th className="fit-column">Estado</th>
                                    <th className="fit-column">Protocolo</th>
                                    <th className="fit-column">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {placements.map((placement) => (
                                    <PlacementRow key={placement.id} placement={placement} />
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {activeTab === 'registrations' && (
                <div className="registrations-content">
                    <div className="registrations-header mb-3">
                        <h5><i className="bi bi-person-check-fill me-2"></i>Registos Pendentes ({registrations.length})</h5>
                        <p className="text-muted">Estudantes com informações incompletas ou sem calendário atribuído</p>
                    </div>

                    {registrations.length === 0 ? (
                        <Alert text="Todos os registos estão completos" type="success" />
                    ) : (
                        <table className="placements-table">
                            <thead>
                                <tr className="header">
                                    <th className="fit-column">Nº</th>
                                    <th>Nome</th>
                                    <th>Email</th>
                                    <th>Curso</th>
                                    <th>Calendário</th>
                                    <th>Problemas</th>
                                    <th className="fit-column">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {registrations.map((reg) => (
                                    <tr key={reg.id} className="table-row">
                                        <td className="fit-column text-center">{reg.id}</td>
                                        <td>{reg.name}</td>
                                        <td>{reg.email}</td>
                                        <td>{reg.course}</td>
                                        <td>{reg.calendar || <span className="badge bg-warning">Não atribuído</span>}</td>
                                        <td>
                                            {reg.issues.map((issue, idx) => (
                                                <span key={idx} className="badge bg-danger me-1">{issue}</span>
                                            ))}
                                        </td>
                                        <td className="d-flex gap-2">
                                            <button 
                                                className="btn btn-sm btn-success"
                                                onClick={() => {
                                                    const notes = prompt('Notas (opcional):');
                                                    validateStudentRegistration(token, reg.id, 'approve', null, notes, setStatus, setErrorMessage)
                                                        .then(() => {
                                                            alert('Registo aprovado!');
                                                            setActiveTab('registrations');
                                                        });
                                                }}
                                            >
                                                <i className="bi bi-check"></i>
                                            </button>
                                            <button 
                                                className="btn btn-sm btn-danger"
                                                onClick={() => {
                                                    const notes = prompt('Motivo da rejeição:');
                                                    if (notes) {
                                                        validateStudentRegistration(token, reg.id, 'reject', null, notes, setStatus, setErrorMessage)
                                                            .then(() => {
                                                                alert('Registo rejeitado');
                                                                setActiveTab('registrations');
                                                            });
                                                    }
                                                }}
                                            >
                                                <i className="bi bi-x"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
};

export default AcademicDashboard;

