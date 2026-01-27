import './edit.css';
import default_pfp from './../../../../assets/imgs/default_pfp.jpg';

import React, { useContext } from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearchParams } from "react-router-dom";
import { PrimaryButton, SecundaryButton, TextInput, Dropdown, OptionButton, Alert, CheckBox, PfpModal } from '../../../../components';

import { getStudent, createStudent, editStudent, getCourse, listCourses } from '../../../../services';
import CurriculumUpload from '../../../../components/CurriculumUpload/curriculumUpload';
import { getCurriculum, deleteCurriculum } from '../../../../services/curriculum';
import { getAllCandidatures, updateCandidatureState } from '../../../../services/candidatures';
import { UserContext } from '../../../../contexts';


const Row = ({ index, name, state, onChange, onDelete }) => {

	const handleChange = (field, value) => {
		onChange(index, field, value);
	};

	const handleDelete = () => {
		onDelete(index, index);
	}

	return (
		<tr className='table-row'>
			<th className='text-center'><p>{index + 1}</p></th>
			<th className='w-75'><p><input onChange={e => handleChange('name', e.target.value)} className='no-decor w-100' type='text' value={name} /></p></th>
			<th>
				<Dropdown text='' value={state} setValue={val => handleChange('state', val)}>
					<option value={2}>Por Fazer</option>
					<option value={1}>A realizar em simultâneo</option>
				</Dropdown>
			</th>
			<th><OptionButton type='delete' action={handleDelete} /></th>
		</tr>
	);
}


const Edit = () => {

	const navigate = useNavigate();
	const { userInfo } = useContext(UserContext);
	const role = userInfo?.role;
	const token = userInfo?.token;
	const permissions = userInfo?.perms || {
		Calendários: { view: false, edit: false, delete: false },
		Cursos: { view: false, edit: false, delete: false },
		Alunos: { view: false, edit: false, delete: false },
		Docentes: { view: false, edit: false, delete: false },
		Empresas: { view: false, edit: false, delete: false },
		Propostas: { view: false, edit: false, delete: false },
		Candidaturas: { view: false, edit: false, delete: false },
	};

	const [searchParams] = useSearchParams();
	const [status, setStatus] = useState(0);
	const [error, setError] = useState("");

	const [show, setShow] = useState(false);
	const [showCurriculumUpload, setShowCurriculumUpload] = useState(false);
	const [curriculum, setCurriculum] = useState(null);

	const id = searchParams.get("id");
	const isNew = searchParams.get("new");

	const [active, setActive] = useState(null);
	const [validationStatus, setValidationStatus] = useState(null);
	const [pfp, setPfp] = useState(null);
	const [fullName, setFullName] = useState(null);
	const [idType, setIdType] = useState(null);
	const [idNumber, setIdNumber] = useState(null);
	const [nacionality, setNacionality] = useState(null);
	const [gender, setGender] = useState(null);
	const [nif, setNif] = useState(null);
	const [contact, setContact] = useState(null);
	const [originalEmail, setOriginalEmail] = useState(null);
	const [email, setEmail] = useState(null);
	const [address, setAddress] = useState(null);

	const [number, setNumber] = useState(null);
	const [course, setCourse] = useState(null);
	const [year, setYear] = useState(null);
	const [average, setAverage] = useState(null);
	const [branch, setBranch] = useState(null);
	const [subjectsDone, setSubjectsDone] = useState(null);
	const [ects, setEcts] = useState(null);

	const [calendar, setCalendar] = useState(null);

	const [todo, setTodo] = useState([]);

	const [courses, setCourses] = useState([]);
	const [branches, setBranches] = useState([]);
	const [calendars, setCalendars] = useState([]);

	useEffect(() => {
		const fetchCourses = async () => {
			const c = await listCourses(userInfo.token, setStatus, setError);
			if (c) {
				setCourses(c);
			}
		};
		fetchCourses();
	}, []);

	useEffect(() => {
		if (id && !isNew) {
			getCurriculum(id, userInfo.token).then(data => {
				setCurriculum(data);
			}).catch(() => {
				setCurriculum(null);
			});
		}
	}, [id, isNew, userInfo.token]);

	const handleDeleteCurriculum = async () => {
		if (window.confirm('Tem a certeza que deseja eliminar o curriculo?')) {
			try {
				await deleteCurriculum(id, userInfo.token);
				setCurriculum(null);
				alert('Curriculo eliminado com sucesso');
			} catch (err) {
				alert('Erro ao eliminar: ' + err.message);
			}
		}
	};

	useEffect(() => {
		setBranch(null);
		setCalendar(null);

		const fetchCourse = async () => {
			if (course === null) return;
			const c = await getCourse(userInfo.token, course, setStatus, setError);

			setBranches(c.branches);
			setCalendars(c.calendars);
		};
		fetchCourse();
	}, [course]);


	const handleValidateStudent = async () => {
		const newStatus = 'validated';
		setValidationStatus(newStatus);

		try {
			// 1. Atualizar o estado do estudante no backend IMEDIATAMENTE
			const currentData = {
				active: active,
				email: email,
				student_number: number,
				student_name: fullName,
				nationality: nacionality,
				ident_type: idType,
				ident_doc: idNumber,
				nif: nif,
				gender: gender,
				address: address,
				contact: contact,
				year: year,
				average: average,
				subjects_done: subjectsDone,
				student_course: course,
				student_branch: branch,
				student_calendar: calendar,
				student_ects: ects,
				subjects: todo.map(t => ({
					subject_name: t.name,
					state: Number(t.state)
				})),
				validation_status: newStatus
			};

			await editStudent(token, id, currentData, setStatus, setError);

			// 2. Buscar candidatura do estudante em estado 'revision'
			const candidaturesList = await getAllCandidatures(token, () => { }, setError);
			if (candidaturesList && Array.isArray(candidaturesList)) {
				// Procurar por número de aluno (comparação solta por segurança)
				const studentCandidature = candidaturesList.find(c =>
					(String(c.studentNumber) === String(id) || String(c.studentNumber) === String(number)) &&
					c.state === 'revision'
				);

				if (studentCandidature) {
					// Avançar candidatura para 'protocol_generated'
					await updateCandidatureState(
						token,
						studentCandidature.id,
						'protocol_generated',
						'Conta Validada',
						() => { },
						setError
					);
				}
			}

			// Recarregar dados para confirmar
			const data = await getStudent(userInfo.token, id, setStatus, setError);
			if (data) {
				setValidationStatus(data.validation_status);
			}
		} catch (err) {
			console.error('Erro ao validar estudante:', err);
			setError('Erro ao processar validação');
		}
	};

	const handleRejectStudent = async () => {
		const newStatus = 'rejected';
		setValidationStatus(newStatus);

		try {
			// 1. Atualizar o estado do estudante no backend IMEDIATAMENTE
			const currentData = {
				active: active,
				email: email,
				student_number: number,
				student_name: fullName,
				nationality: nacionality,
				ident_type: idType,
				ident_doc: idNumber,
				nif: nif,
				gender: gender,
				address: address,
				contact: contact,
				year: year,
				average: average,
				subjects_done: subjectsDone,
				student_course: course,
				student_branch: branch,
				student_calendar: calendar,
				student_ects: ects,
				subjects: todo.map(t => ({
					subject_name: t.name,
					state: Number(t.state)
				})),
				validation_status: newStatus
			};

			await editStudent(token, id, currentData, setStatus, setError);

			// 2. Buscar candidatura do estudante em estado 'revision'
			const candidaturesList = await getAllCandidatures(token, () => { }, setError);
			if (candidaturesList && Array.isArray(candidaturesList)) {
				const studentCandidature = candidaturesList.find(c =>
					(String(c.studentNumber) === String(id) || String(c.studentNumber) === String(number)) &&
					c.state === 'revision'
				);

				if (studentCandidature) {
					// Mudar candidatura para 'finished'
					await updateCandidatureState(
						token,
						studentCandidature.id,
						'finished',
						'Conta Rejeitada',
						() => { },
						setError
					);
				}
			}

			// Recarregar dados para confirmar
			const data = await getStudent(userInfo.token, id, setStatus, setError);
			if (data) {
				setValidationStatus(data.validation_status);
			}
		} catch (err) {
			console.error('Erro ao rejeitar estudante:', err);
			setError('Erro ao processar rejeição');
		}
	};

	const submit = async () => {

		const data = {
			active: active,
			email: email,
			student_number: number,
			student_name: fullName,
			nationality: nacionality,
			ident_type: idType,
			ident_doc: idNumber,
			nif: nif,
			gender: gender,
			address: address,
			contact: contact,
			year: year,
			average: average,
			subjects_done: subjectsDone,
			student_course: course,
			student_branch: branch,
			student_calendar: calendar,
			student_ects: ects,
			subjects: todo.map(t => ({
				subject_name: t.name,
				state: Number(t.state)
			})),
			validation_status: validationStatus
		};

		if (isNew) {
			if (await createStudent(token, data, setStatus, setError))
				cancel();
		} else {
			if (await editStudent(token, id, data, setStatus, setError))
				cancel();
		}
	}

	const cancel = () => {
		if (window.history?.length > 2)
			navigate(-1);
		else
			navigate('/');
	}

	useEffect(() => {
		if (id && !isNew) {
			getStudent(userInfo.token, id, setStatus, setError).then(data => {
				setActive(data.active)
				setValidationStatus(data.validation_status)
				setPfp(data.pfp);
				setFullName(data.name);
				setNumber(data.student_number);
				setOriginalEmail(data.email);
				setEmail(data.email);
				setNif(data.nif);
				setGender(data.gender);
				setNacionality(data.nationality);
				setIdType(data.ident_type);
				setIdNumber(data.ident_doc);
				setAddress(data.address);
				setContact(data.contact);
				setYear(data.year);
				setEcts(data.ects);
				setAverage(data.average);
				setSubjectsDone(data.subjects_done);
				setCourse(data.course.id);
				setBranch(data.branch?.id || null);
				setCalendar(data.calendar?.id || null);
				setTodo(data.subjects);
			});
		}
	}, [id, isNew, show]);


	const handleTodoChange = React.useCallback((index, field, value) => {
		setTodo(prev =>
			prev.map((b, i) =>
				i === index ? { ...b, [field]: value } : b
			)
		);
	}, []);

	const handleTodoDelete = async (index) => {
		setTodo(prev => prev.filter((_, i) => i !== index));
	};


	return (
		<>
			<div id='student' className='d-flex flex-column'>
				<section className='row p-0'>
					<h4>Perfil</h4>
					<div className="profile d-flex flex-column flex-md-row p-0 col-sm-12 col-md-4">
						<div className="profile-picture h-100" style={{ backgroundImage: `url(${pfp ? pfp : default_pfp})` }}></div>
						<div className="options d-flex flex-column justify-content-center w-100">
							{(userInfo?.role === "admin" || (userInfo?.role === "teacher" && userInfo.id !== id) || userInfo?.perms["Alunos"].edit) && <CheckBox value={active} setValue={setActive} label={"Ativo"} />}
							{(userInfo?.role === "admin" || userInfo?.role === "academic_services") && validationStatus === 'pending' && (
								<>
									<p><strong>Estado de Validação:</strong> Por Validar</p>
									<div className='d-flex gap-2'>
										<button
											className='btn btn-danger btn-sm'
											onClick={handleRejectStudent}
										>
											<i className="bi bi-x-circle me-2"></i>
											Rejeitar
										</button>
										<button
											className='btn btn-success btn-sm'
											onClick={handleValidateStudent}
										>
											<i className="bi bi-check-circle me-2"></i>
											Validar
										</button>
									</div>
								</>
							)}
							{(userInfo?.role === "admin" || userInfo?.role === "academic_services") && validationStatus === 'validated' && (
								<p><strong>Estado de Validação:</strong> Validado</p>
							)}
							{(userInfo?.role === "admin" || userInfo?.role === "academic_services") && validationStatus === 'rejected' && (
								<p><strong>Estado de Validação:</strong> Rejeitado</p>
							)}
							<PrimaryButton small content={<p>Alterar Foto de Perfil</p>} action={() => setShow(true)} />
							<PrimaryButton small content={<p>Alterar Currículo</p>} action={() => setShowCurriculumUpload(!showCurriculumUpload)} />
							{curriculum && <SecundaryButton small content={<p>Eliminar Currículo</p>} action={handleDeleteCurriculum} />}
							<PrimaryButton small content={<p>Alterar Palavra-Passe</p>} action={() => navigate("/setPassword", { state: { email: originalEmail } })} />
						</div>
					</div>
					{showCurriculumUpload && (
						<div className='col-sm-12 col-md-8'>
							<CurriculumUpload
								studentId={id}
								token={userInfo.token}
								onSuccess={() => {
									setShowCurriculumUpload(false);
								}}
							/>
						</div>
					)}
				</section>

				<section className='row p-0'>
					<h4>Dados Pessoais</h4>
					<div className='row'>

						<div className="inputs d-flex flex-column col-sm-12 col-md-6">
							<TextInput text='Nome Completo' value={fullName} setValue={setFullName} />
							<div className="row p-0">
								<TextInput className='col' text='Nacionalidade' value={nacionality} setValue={setNacionality} />
								<Dropdown className='col' text='Género' value={gender} setValue={setGender}>
									<option value="Masculino">Masculino</option>
									<option value="Feminino">Feminino</option>
									<option value="Outros">Outros</option>
								</Dropdown>
							</div>
							<TextInput text='Email' type='email' value={email} setValue={setEmail} />
						</div>

						<div className="inputs d-flex flex-column col-sm-12 col-md-6">
							<div className="row p-0">
								<Dropdown className='col' text='Tipo de Documento' value={idType} setValue={setIdType}>
									<option value="Cartão de Cidadão">Cartão de Cidadão</option>
									<option value="Bilhete de Identidade">Bilhete de Identidade</option>
									<option value="Passaporte">Passaporte</option>
								</Dropdown>
								<TextInput className='col' type='number' text='Documento de Identificação' value={idNumber} setValue={setIdNumber} />
							</div>
							<div className="row p-0">
								<TextInput className='col' type='number' text='NIF' value={nif} setValue={setNif} />
								<TextInput className='col' type='number' text='Contacto' value={contact} setValue={setContact} />
							</div>
							<TextInput className='col' text='Morada' value={address} setValue={setAddress} />
						</div>

					</div>
				</section>

				<section className='row p-0'>
					<h4>Dados Curriculares</h4>
					<div className="row inputs">
						<div className="row">
							<TextInput className='col' type='number' text='Número de aluno' value={number} setValue={setNumber} />
							<TextInput className='col' type='number' text='Ano Curricular' value={year} setValue={setYear} />
							<TextInput className='col' type='number' text='Média' value={average} setValue={setAverage} />
							<TextInput className='col' type='number' text='Unidades Curriculares Realizadas' value={subjectsDone} setValue={setSubjectsDone} />
							<TextInput className='col' type='number' text='ECTS Realizadas' value={ects} setValue={setEcts} />
						</div>
						<div className="row">
							<Dropdown className='col' text='Curso' value={course} setValue={(v) => setCourse(Number(v))}>
								{courses.map((c) => (
									<option key={"c_" + c.id} value={c.id}>{c.name}</option>
								))}
							</Dropdown>
							<Dropdown className='col' text='Ramo' value={branch} setValue={(v) => setBranch(Number(v))} disabled={branches.length <= 0}>
								{branches.map((b) => (
									<option key={"b_" + b.id_branch} value={b.id_branch}>{b.branch_name}</option>
								))}
							</Dropdown>
							{(role !== "student") && <Dropdown className='col' text='Calendário' value={calendar} setValue={(v) => setCalendar(Number(v))} disabled={calendars.length <= 0}>
								{calendars.map((cl) => (
									<option key={"cl_" + cl.id} value={cl.id}>{cl.title}</option>
								))}
							</Dropdown>}
						</div>
					</div>
				</section>

				<section className='row p-0 w-100'>
					<div className="d-flex flex-row justify-content-between align-items-center">
						<h4>Cadeiras por fazer</h4>
						<PrimaryButton small action={() => { setTodo(prev => [...prev, { name: '', state: 2 }]); }} content={<div className='d-flex flex-row gap-2'><i className="bi bi-plus-lg"></i><p>Adicionar cadeira</p></div>} />
					</div>
					{(todo?.length === 0) && (<Alert type='info' text='Não tem nenhuma Unidade Curricular registada.' />)}

					{todo?.length > 0 && (
						<table>
							<tr className='header'>
								<th className='fit-column'><p>#</p></th>
								<th><p>Cadeira</p></th>
								<th><p>Estado</p></th>
								<th></th>
							</tr>
							{todo.map((subject, index) => (
								<Row key={index} index={index} {...subject} onChange={handleTodoChange} onDelete={handleTodoDelete} />
							))}
						</table>
					)}
				</section>

				<section className="buttons d-flex flex-row gap-3 col-sm-12 col-md-5 p-0">
					<PrimaryButton action={submit} content={<h6>Guardar</h6>} />
					<SecundaryButton action={cancel} content={<h6>Cancelar</h6>} />
				</section>
			</div>

			<PfpModal show={show} setShow={setShow} email={email} />

		</>
	);

}

export default Edit;