import './active.css';
import { useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { OptionButton, Alert, State, Pill } from '../../../../components';
import { getActiveInternships } from '../../../../services/candidatures';
import { UserContext } from '../../../../contexts';
import { useDebounce } from '../../../../utils';

const ActiveInternships = () => {
    const navigate = useNavigate();
    const { userInfo } = useContext(UserContext);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [list, setList] = useState([]);

    const [filters, setFilters] = useState({
        student: '',
        company: '',
        course: '',
        state: 'all'
    });

    const debouncedFilters = useDebounce(filters, 300);

    const stateMap = {
        'placed': 2,
        'accepted': 3,
        'rejected': 4,
        'protocol_generated': 5,
        'presidency_signature': 6,
        'company_signature': 7,
        'student_signature': 8,
        'in_internship': 9,
        'finished': 10,
    };

    const stateLabels = {
        'placed': 'Colocado',
        'accepted': 'Aceite',
        'rejected': 'Rejeitado',
        'protocol_generated': 'Protocolo Gerado',
        'presidency_signature': 'Assinatura ISEC',
        'company_signature': 'Assinatura Empresa',
        'student_signature': 'Assinatura Aluno',
        'in_internship': 'Em estágio',
        'finished': 'Finalizado',
    };

    const fetchInternships = useCallback(async () => {
        setLoading(true);
        const data = await getActiveInternships(userInfo.token, () => { }, setError);
        if (data) {
            setList(data);
        }
        setLoading(false);
    }, [userInfo.token, setError]);

    useEffect(() => {
        if (userInfo?.token) {
            fetchInternships();
        }
    }, [userInfo.token, fetchInternships]);

    const updateFilter = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const getFilteredList = () => {
        if (!list) return [];
        return list.filter(item => {
            const matchesStudent = (item.student.name?.toLowerCase().includes(debouncedFilters.student.toLowerCase()) ||
                item.student.number?.toString().includes(debouncedFilters.student));
            const matchesCompany = item.companyName?.toLowerCase().includes(debouncedFilters.company.toLowerCase());
            const matchesCourse = (item.student.course?.toLowerCase().includes(debouncedFilters.course.toLowerCase()) ||
                item.student.course_acronym?.toLowerCase().includes(debouncedFilters.course.toLowerCase()));
            const matchesState = debouncedFilters.state === 'all' || item.state === debouncedFilters.state;

            return matchesStudent && matchesCompany && matchesCourse && matchesState;
        });
    };

    const Row = ({ id, student, companyName, proposalName, state }) => {
        const view = () => {
            navigate("/candidature/edit?id=" + id);
        }

        return (
            <tr className='table-row'>
                <th className='fit-column'><State state={stateMap[state] || 1} hideState={true} hideText={true} tooltip={true} /></th>
                <th className='fit-column text-center'><p>{student.number}</p></th>
                <th><p>{student.name}</p></th>
                <th className='fit-column'><Pill text={student.course_acronym} color="blue" tooltip={student.course} /></th>
                <th><p>{companyName}</p></th>
                <th><p>{proposalName}</p></th>
                <th className='fit-column'>
                    <div className='d-flex gap-2 justify-content-center'>
                        <OptionButton type='view' action={view} />
                    </div>
                </th>
            </tr>
        );
    }

    return (
        <div className='active-internships d-flex flex-column'>
            <div className="top d-flex flex-row justify-content-between align-items-center">
                <div className="title"><h4>Estágios e Colocações Ativas</h4></div>
            </div>

            <div className="filters-container d-flex flex-row gap-3 mt-4 mb-4">
                <div className="filter-group">
                    <label>Estudante</label>
                    <input
                        type="text"
                        placeholder="Nome ou Número"
                        value={filters.student}
                        onChange={(e) => updateFilter('student', e.target.value)}
                    />
                </div>
                <div className="filter-group">
                    <label>Curso</label>
                    <input
                        type="text"
                        placeholder="Nome ou Sigla"
                        value={filters.course}
                        onChange={(e) => updateFilter('course', e.target.value)}
                    />
                </div>
                <div className="filter-group">
                    <label>Empresa</label>
                    <input
                        type="text"
                        placeholder="Nome da Empresa"
                        value={filters.company}
                        onChange={(e) => updateFilter('company', e.target.value)}
                    />
                </div>
                <div className="filter-group">
                    <label>Estado</label>
                    <select value={filters.state} onChange={(e) => updateFilter('state', e.target.value)}>
                        <option value="all">Todos os estados</option>
                        {Object.entries(stateLabels).map(([code, label]) => (
                            <option key={code} value={code}>{label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {loading && <Alert text='A carregar estágios ativos...' />}
            {error && <Alert text={error} type="danger" />}

            {!loading && !error && getFilteredList().length === 0 && (
                <Alert text='Não foram encontrados estágios ativos com os filtros selecionados' />
            )}

            {!loading && !error && getFilteredList().length > 0 && (
                <table className="mt-2">
                    <thead>
                        <tr className='header'>
                            <th className='fit-column'><p>St.</p></th>
                            <th className='fit-column'><p>Nº</p></th>
                            <th><p>Estudante</p></th>
                            <th className='fit-column'><p>Curso</p></th>
                            <th><p>Empresa/Docente</p></th>
                            <th><p>Proposta</p></th>
                            <th className='fit-column'></th>
                        </tr>
                    </thead>
                    <tbody>
                        {getFilteredList().map(item => (
                            <Row key={item.id} {...item} />
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default ActiveInternships;
