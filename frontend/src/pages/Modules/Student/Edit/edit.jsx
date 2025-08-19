import './edit.css';
import default_pfp from './../../../../assets/imgs/default_pfp.jpg';

import React, { useContext } from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearchParams } from "react-router-dom";
import { PrimaryButton, PrimaryButtonSmall, SecundaryButton, TextInput, Dropdown, OptionButton, Alert, CheckBox, PfpModal } from '../../../../components';

import { getStudent, createStudent, editStudent, getCourse, listCourses } from '../../../../services';
import { UserContext } from '../../../../contexts';


const Row = ({index, name, state, onChange, onDelete}) => {

	const handleChange = (field, value) => {
		onChange(index, field, value);
	};

	const handleDelete = () => {
		onDelete(index, index);
	}

	return(
		<tr className='table-row'>
			<th className='text-center'><p>{index+1}</p></th>
			<th className='w-75'><p><input onChange={e => handleChange('name', e.target.value)} className='no-decor w-100' type='text' value={name}/></p></th>
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


const Edit = () =>  {
	const token = localStorage.getItem("access_token");

	const navigate = useNavigate();
	const { userInfo } = useContext(UserContext);
	const role = userInfo?.role;
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

	const id = searchParams.get("id");
  const isNew = searchParams.get("new");
	
	const [active, setActive] = useState(null);
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
			setCourses(c.filter(c => c.active_calendars_registrations));
		};
		fetchCourses();
	}, []);

	useEffect(() => {
		setBranch(null);
		setCalendar(null);

		const fetchCourse = async () => {
			if(course === null) return;
			const c = await getCourse(userInfo.token, course, setStatus, setError);

			setBranches(c.branches);
			setCalendars(c.calendars);
		};
		fetchCourse();
	}, [course]);


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
			}))
		};

		if (isNew) {
			if(await createStudent(token, data, setStatus, setError))
				cancel();
		} else {
			if(await editStudent(token, id, data, setStatus, setError))
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
				setBranch(data.branch.id);
				setCalendar(data.calendar.id);
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


	return(
		<>
		<div id='student' className='d-flex flex-column'>
			<section className='row p-0'>
				<h4>Perfil</h4>
				<div className="profile d-flex flex-column flex-md-row p-0 col-sm-12 col-md-4">
					<div className="profile-picture h-100" style={{backgroundImage: `url(${ pfp ? pfp : default_pfp })`}}></div>
					<div className="options d-flex flex-column justify-content-center w-100">
						{(userInfo?.role === "admin" || (userInfo?.role === "teacher" && userInfo.id !== id) || userInfo?.perms["Alunos"].edit) && <CheckBox value={active} setValue={setActive} label={"Ativo"} />}
						<PrimaryButtonSmall content={<p>Alterar Foto de Perfil</p>} action={() => setShow(true)} />
						<PrimaryButtonSmall content={<p>Alterar Currículo</p>} />
						<PrimaryButtonSmall content={<p>Alterar Palavra-Passe</p>} action={() => navigate("/setPassword", { state: { email: originalEmail } })} />
					</div>
				</div>
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
					<PrimaryButtonSmall action={() => {setTodo(prev => [...prev, {name: '', state: 2}]);}} content={<div className='d-flex flex-row gap-2'><i className="bi bi-plus-lg"></i><p>Adicionar cadeira</p></div>} />
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