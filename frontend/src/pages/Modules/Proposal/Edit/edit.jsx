import './edit.css';
import default_pfp from './../../../../assets/imgs/default_pfp.jpg';

import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearchParams } from "react-router-dom";
import { PrimaryButton, PrimaryButtonSmall, SecundaryButton, TextInput, Dropdown, OptionButton, TextArea, CheckBox, Alert } from '../../../../components';
import { UserContext } from '../../../../contexts';
import { getCompany, getCourse, listCourses } from '../../../../helpers';
import { createProposal } from '../../../../services/proposals';

const Edit = () =>  {

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

	const id = searchParams.get("id");
  const isNew = searchParams.get("new");
  const isCreated = searchParams.get("create");
  const typeUrl = searchParams.get("type");

	useEffect(() => {
		if (id && !isNew) {
			// TODO : getProposal
		}
	}, [id, isNew]);

	const [company, setCompany] = useState(userInfo.company);
	const [representatives, setRepresentatives] = useState([]);

	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [technologies, setTechnologies] = useState("");
	const [methodologies, setMethodologies] = useState("");
	const [scheduling, setScheduling] = useState("");
	const [selection, setSelection] = useState("");
	const [conditions, setConditions] = useState("");

	const [type, setType] = useState(typeUrl === "project" ? 2 : null);
	const [course, setCourse] = useState(null);
	const [branch, setBranch] = useState([]);
	const [calendar, setCalendar] = useState(null);
	const [format, setFormat] = useState(null);
	const [localization, setLocalization] = useState(null);
	const [schedule, setSchedule] = useState(null);
	const [slots, setSlots] = useState(0);
	const [objectives, setObjectives] = useState(null);
	const [responsible, setResponsible] = useState(null);

	const [responsibleName, setResponsibleName] = useState(null);
	const [responsibleEmail, setResponsibleEmail] = useState(null);

	const [tec, setTec] = useState(false);
  const [met, setMet] = useState(false);
  const [obj, setObj] = useState(false);


	useEffect(() => {
		const fecthRepresentatives = async () => {
			console.log(company)
			if(company === "undefined" || company === null) return;

			const c = await getCompany(userInfo.token, company, setStatus, setError);
			setRepresentatives(c.representatives);
		};
		fecthRepresentatives();
	}, [company]);

	const [noCourses, setnoCourses] = useState(false);
	const [courses, setCourses] = useState([]);
	const [branches, setBranches] = useState([]);
	const [calendars, setCalendars] = useState([]);
	useEffect(() => {
		const fetchCourses = async () => {
			const c = await listCourses(userInfo.token, setStatus, setError);
			setCourses(c.filter(c => c.active_calendars_submission));
			setnoCourses(c.filter(c => c.active_calendars_submission).length <= 0);
		};
		fetchCourses();
	}, []);

	useEffect(() => {
		setBranch([]);
		setCalendar(null);

		const fetchCourse = async () => {
			if(course === null) return;
			const c = await getCourse(userInfo.token, course, setStatus, setError);

			setBranches(c.branches);
			setCalendars(c.calendars);

			setTec(c.technologies_active)
			setMet(c.methodologies_active);
			setObj(c.objectives_active)
		};
		fetchCourse();
	}, [course]);



	const submit = async () => {
		const data = {
			company_id: company ? Number(company) : null,
			advisor_id: responsible !== -1 && responsible !== null ? Number(responsible) : null,
			advisor_data: responsible === -1 ? {
				name: responsibleName,
				email: responsibleEmail,
			} : null,
			advisor_isec_id: role === "teacher" ? Number(userInfo.id) : null,
			proposal_type: Number(type),
			work_format: Number(format),
			course_id: Number(course),
			branches: branch.map(Number),
			calendar_id: Number(calendar),
			title: title,
			description: description,
			selection: selection,
			conditions: conditions,
			scheduling: scheduling,
			technologies: technologies,
			methodologies: methodologies,
			objectives: objectives,
			location: localization,
			schedule: schedule,
			slots: Number(slots),
		};

		if(isNew) {
			if(await createProposal(userInfo.token, data, setStatus, setError))
				cancel();
		}


	}
	
	const cancel = () => {
		if (window.history.length > 2)
			navigate(-1);
		else
			navigate('/');
	}


	return(
		<div id='student' className='d-flex flex-column'>

			{(noCourses && isNew)&& <Alert type='danger' text='Não existe nenhum calendário ativo de momento' />}

			{(!noCourses || !isNew) && <>
			
			<h4>{isNew ? "Submeter Proposta" : "Editar Proposta"}</h4>

			<section className='inputs d-flex flex-column flex-md-row p-0'>

				<div className="inputs d-flex flex-column w-100">
					<TextInput text='Título' value={title} setValue={setTitle} disabled={noCourses} />
					<TextArea text='Descrição' value={description} setValue={setDescription} disabled={noCourses} />
					{tec && <TextArea text='Tecnologias' value={technologies} setValue={setTechnologies} disabled={noCourses} />}
					{met && <TextArea text='Metodologias' value={methodologies} setValue={setMethodologies} disabled={noCourses} />}
					<TextArea text='Calendarização' value={scheduling} setValue={setScheduling} disabled={noCourses} />
					<TextArea text='Processo de Seleção' value={selection} setValue={setSelection} disabled={noCourses} />
					<TextArea text='Condições oferecidas' value={conditions} setValue={setConditions} disabled={noCourses} />
				</div>

				<div className="inputs d-flex flex-column w-100">
					{isCreated && <Dropdown text='Empresa' placeholder='Selecione uma Empresa'/>}

					<Dropdown text='Tipo de Proposta' value={type} setValue={(e) => setType(Number(e))} disabled={typeUrl != null || noCourses} >
						<option value={1}>Estágio</option>
						<option value={2}>Projeto</option>
					</Dropdown>

					<Dropdown text='Curso' value={course} setValue={(v) => setCourse(Number(v))} disabled={noCourses} >
						{courses?.map((c, index) => (
							<option key={index} value={c.id}>{c.name}</option>
						))}
					</Dropdown>

					{branches?.length > 0 && 
						<div className="branches">
							<b>Ramos</b>
							<div className="d-flex flex-wrap gap-4">
								{branches.map((b) => (
									<CheckBox
										key={b.id_branch}
										label={b.branch_name}
										value={branch?.includes(b.id_branch) || false}
										setValue={() => {
											setBranch(prev => {
												const prevArray = Array.isArray(prev) ? prev : [];
												if (prevArray.includes(b.id_branch)) {
													return prevArray.filter(id => id !== b.id_branch);
												} else {
													return [...prevArray, b.id_branch];
												}
											});
										}}
									/>
								))}
							</div>
						</div>
					}

					<Dropdown text='Calendário' value={calendar} setValue={(e) => setCalendar(Number(e))} disabled={course === null || noCourses} >
						{calendars.filter(cl => cl.active).map((cl) => (
							<option key={cl.id} value={cl.id}>{cl.title}</option>
						))}
					</Dropdown>

					<div className="inputs d-flex flex-row">
						<Dropdown className='w-100' text='Regime' value={format} setValue={setFormat} disabled={noCourses} >
							<option value={1}>Presencial</option>
							<option value={2}>Híbrido</option>
							<option value={3}>Remoto</option>
						</Dropdown>
						<TextInput className='w-100' text='Local' value={localization} setValue={setLocalization} disabled={noCourses} />
					</div>

					<div className="inputs d-flex flex-row">
						<TextInput className='w-100' text='Horário' value={schedule} setValue={setSchedule} disabled={noCourses} />
						<TextInput className='w-100' type='number' text='Nº de vagas' value={slots} setValue={(e) => setSlots(Number(e))} disabled={noCourses} />
					</div>

					{obj && <TextArea text='Objetivos' value={objectives} setValue={setObjectives} disabled={noCourses} />}

					{typeUrl === null && 
						<Dropdown text='Orientador' value={responsible} setValue={(e) => setResponsible(Number(e))} disabled={company === null || noCourses}>
							<option value={-1}>Novo Representante</option>
							{representatives?.map((r) => (
								<option key={r.id} value={r.id}>{r.name}</option>
							))}
						</Dropdown>
					}

					{(responsible === -1 || typeUrl === null) &&
						<div className="pane d-flex flex-column gap-3">
							<TextInput value={responsibleName} setValue={setResponsibleName} text='Nome do Orientador' tooltip={"Verifique se o Orientador não se encontra já registado no sistema"} disabled={noCourses} />
							<TextInput type='email' value={responsibleEmail} setValue={setResponsibleEmail} text='Email do Orientador' tooltip={"Verifique se o Orientador não se encontra já registado no sistema"} disabled={noCourses} />
						</div>
					}

					<section className="buttons d-flex flex-row gap-3 mt-5 p-0">
						<PrimaryButton className='col' action={submit} content={<h6>{(isNew) ? "Submeter" : "Guardar"}</h6>} disabled={noCourses} />
						<SecundaryButton className='col' action={cancel} content={<h6>Cancelar</h6>} />
					</section>
				</div>

			</section>

			</>}

		</div>
	);

}

export default Edit;