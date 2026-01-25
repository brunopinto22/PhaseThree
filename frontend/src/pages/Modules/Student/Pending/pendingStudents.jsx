import './pendingStudents.css';
import { useState, useEffect } from 'react';
import { Alert, PrimaryButton, SecundaryButton } from '../../../../components';
import { listPendingStudents, validateStudent } from '../../../../services/studentValidation';

const PendingStudents = () => {
    const token = localStorage.getItem('access_token');
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);

    useEffect(() => {
        fetchPendingStudents();
    }, []);

    const fetchPendingStudents = async () => {
        setLoading(true);
        try {
            const data = await listPendingStudents(token);
            setStudents(data || []);
        } catch (error) {
            setError('Erro ao carregar estudantes pendentes');
        }
        setLoading(false);
    };

    const handleApprove = async (studentNumber) => {
        try {
            await validateStudent(token, studentNumber, 'approve');
            // Remove from list after approval
            setStudents(students.filter(s => s.student_number !== studentNumber));
        } catch (error) {
            setError('Erro ao aprovar estudante');
        }
    };

    const handleReject = (student) => {
        setSelectedStudent(student);
        setShowRejectModal(true);
    };

    const confirmReject = async () => {
        if (!rejectionReason.trim()) {
            setError('Motivo de rejeição é obrigatório');
            return;
        }

        try {
            await validateStudent(token, selectedStudent.student_number, 'reject', rejectionReason);
            setStudents(students.filter(s => s.student_number !== selectedStudent.student_number));
            setShowRejectModal(false);
            setRejectionReason('');
            setSelectedStudent(null);
        } catch (error) {
            setError('Erro ao rejeitar estudante');
        }
    };

    const Row = ({ student }) => (
        <tr className='table-row'>
            <td><p>{student.student_number}</p></td>
            <td><p>{student.name}</p></td>
            <td><p>{student.email}</p></td>
            <td><p>{student.course}</p></td>
            <td>
                <div className='d-flex gap-2'>
                    <button
                        className='btn btn-sm btn-success'
                        onClick={() => handleApprove(student.student_number)}
                    >
                        Aprovar
                    </button>
                    <button
                        className='btn btn-sm btn-danger'
                        onClick={() => handleReject(student)}
                    >
                        Rejeitar
                    </button>
                </div>
            </td>
        </tr>
    );

    if (loading) return <div className="p-4">A carregar...</div>;

    return (
        <div className='pending-students d-flex flex-column p-4'>
            <h3>Estudantes Pendentes de Validação</h3>

            {error && <Alert text={error} type='danger' />}

            {students.length === 0 && (
                <Alert text='Não existem estudantes pendentes de validação' type='info' />
            )}

            {students.length > 0 && (
                <table className='mt-3'>
                    <thead>
                        <tr className='header'>
                            <th><p>Nº Aluno</p></th>
                            <th><p>Nome</p></th>
                            <th><p>Email</p></th>
                            <th><p>Curso</p></th>
                            <th><p>Ações</p></th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.map(student => (
                            <Row key={student.student_number} student={student} />
                        ))}
                    </tbody>
                </table>
            )}

            {/* Reject Modal */}
            {showRejectModal && (
                <div className='modal-overlay' onClick={() => setShowRejectModal(false)}>
                    <div className='modal-content' onClick={e => e.stopPropagation()}>
                        <h4>Rejeitar Estudante</h4>
                        <p>Estudante: {selectedStudent?.name}</p>
                        <textarea
                            className='form-control mt-2'
                            rows='4'
                            placeholder='Motivo da rejeição...'
                            value={rejectionReason}
                            onChange={e => setRejectionReason(e.target.value)}
                        />
                        <div className='d-flex gap-2 mt-3'>
                            <PrimaryButton
                                action={confirmReject}
                                content={<h6>Confirmar</h6>}
                            />
                            <SecundaryButton
                                action={() => setShowRejectModal(false)}
                                content={<h6>Cancelar</h6>}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PendingStudents;
