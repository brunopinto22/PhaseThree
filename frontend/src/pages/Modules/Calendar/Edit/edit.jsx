import './edit.css';
import { useContext, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { TextInput, PrimaryButton, SecundaryButton, Dropdown } from '../../../../components';
import { UserContext } from '../../../../contexts';
import { isDateInLectiveYear, toDate } from '../../../../utils';
import { createCalendar, editCalendar, getCalendar } from '../../../../services/calendars';

const Edit = () => {

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
	const id = searchParams.get('id');
	const isNew = searchParams.get('new');
	const courseId = searchParams.get('course');
	const [status, setStatus] = useState(null);
	const [error, setError] = useState(null)

	useEffect(() => {
		if (!isNew && !id)
			navigate("/notfound");

	}, [isNew, id, navigate, role, permissions]);


	const [year, setYear] = useState(0);
	const [semester, setSemester] = useState(0);
	const [submissionStart, setSubmissionStart] = useState("");
	const [submissionEnd, setSubmissionEnd] = useState("");
	const [candidatures, setCandidatures] = useState("");
	const [divulgation, setDivulgation] = useState("");
	const [registrations, setRegistrations] = useState("");
	const [placements, setPlacements] = useState("");
	const [min, setMin] = useState(1);
	const [max, setMax] = useState(6);

	useEffect(() => {
		const token = userInfo.token;
		if (id && !isNew) {
			getCalendar(token, id, setStatus, setError).then(data => {
				setYear(data.year);
				setSemester(data.semester);
				setSubmissionStart(data.date_submission_start);
				setSubmissionEnd(data.date_submission_end);
				setCandidatures(data.date_candidatures);
				setDivulgation(data.date_divulgation);
				setRegistrations(data.date_registrations);
				setPlacements(data.date_placements);
				setMin(data.min);
				setMax(data.max);
			});
		}
	}, [id, isNew]);

	const submit = () => {

		const data = {
			course_id: courseId || null,
			year: Number(year),
			semester: semester,
			submission_start: submissionStart,
			submission_end: submissionEnd,
			divulgation: divulgation,
			registrations: registrations,
			candidatures: candidatures,
			placements: placements,
			min: min,
			max: max,
		}

		if(isNew) {
			if(createCalendar(userInfo.token, data, setStatus, setError))
				navigate(-1);
		} else {
			if(editCalendar(userInfo.token, id, data, setStatus, setError))
				navigate(-1);
		}

	}

	const cancel = () => {
		if (window.history.length > 2)
			navigate(-1);
		else
			navigate('/');
	}

	const submissionStartDate = toDate(submissionStart);
	const submissionEndDate = toDate(submissionEnd);
	const candidaturesDate = toDate(candidatures);
	const divulgationDate = toDate(divulgation);
	const registrationsDate = toDate(registrations);
	const placementsDate = toDate(placements);

	const errors = {
		submissionStart: submissionStart
			? !isDateInLectiveYear(year, submissionStart)
			: false,

		submissionEnd: submissionEnd
			? !isDateInLectiveYear(year, submissionEnd) || (submissionStartDate && submissionEndDate && submissionEndDate < submissionStartDate)
			: false,

		divulgation: divulgation
			? !isDateInLectiveYear(year, divulgation) || (submissionEndDate && divulgationDate && divulgationDate < submissionEndDate)
			: false,

		registrations: registrations
			? !isDateInLectiveYear(year, registrations) || (divulgationDate && registrationsDate && registrationsDate > divulgationDate) || (candidaturesDate && registrationsDate && registrationsDate > candidaturesDate)
    	: false,

		candidatures: candidatures
			? !isDateInLectiveYear(year, candidatures) || (divulgationDate && candidaturesDate && candidaturesDate < divulgationDate)
			: false,

		placements: placements
			? !isDateInLectiveYear(year, placements) || (candidaturesDate && placementsDate && placementsDate < candidaturesDate)
			: false,

		minMax: min > max,
	};

	return(
		<div id="calendar" className='d-flex flex-column'>

			<h4>{isNew ? "Criar" : "Editar"} Calendário</h4>

			<section className="inputs d-flex flex-column p-0">
				<div className="inputs col d-flex flex-row">
					<Dropdown className='col' text='Ano letivo' value={year} setValue={setYear}>
						{Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2 + i).map((d) => (
							<option key={d} value={d}>{d}/{d+1}</option>
						))}
					</Dropdown>

					<Dropdown className='col' text='Semestre' value={semester} setValue={setSemester}>
						<option value={1}>1º</option>
						<option value={2}>2º</option>
					</Dropdown>
				</div>

				<div className="inputs col d-flex flex-row">
					<div className="inputs col d-flex flex-column">
						<TextInput type='date' text='Início Submissões' value={submissionStart} setValue={setSubmissionStart} error={errors.submissionStart} tooltip={"Data a partir da qual as empresas e docentes podem começar a submeter propostas de projetos ou estágios."} />
						<TextInput type='date' text='Divulgação' value={divulgation} setValue={setDivulgation} error={errors.divulgation} tooltip={"Data a partir da qual as propostas ficam disponíveis para os alunos."} />
						<TextInput type='date' text='Colocações' value={placements} setValue={setPlacements} error={errors.placements} />
					</div>
					<div className="inputs col d-flex flex-column">
						<TextInput type='date' text='Fim Submissões' value={submissionEnd} setValue={setSubmissionEnd} error={errors.submissionEnd} />
						<TextInput type='date' text='Candidaturas' value={candidatures} setValue={setCandidatures} error={errors.candidatures} />
						<TextInput type='date' text='Inscrição de Alunos' value={registrations} setValue={setRegistrations} error={errors.registrations} />
					</div>
				</div>

				<div className="inputs col d-flex flex-row">
					<TextInput className='col' type='number' text='Mínimo de Candidaturas' value={min} setValue={(e) => setMin(Number(e))} error={errors.minMax}/>
					<TextInput className='col' type='number' text='Máximo de Candidaturas' value={max} setValue={(e) => setMax(Number(e))} error={errors.minMax}/>
				</div>

			</section>

			<section className="buttons d-flex flex-row gap-3 col-sm-12 col-md-5 p-0">
				<PrimaryButton action={submit} content={<h6>{isNew ? "Submeter" : "Guardar"}</h6>} />
				<SecundaryButton action={cancel} content={<h6>Cancelar</h6>} />
			</section>

			{error && <p className='error'>{error}</p>}

		</div>
	);

}

export default Edit;