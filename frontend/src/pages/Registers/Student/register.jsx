import './register.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from './../../../assets/imgs/logo.png';
import bg from './.././../../assets/imgs/student.jpg';
import { PrimaryButton, TertiaryButton, TextInput, PasswordInput, Dropdown } from './../../../components';
import { getSupportEmail, listCourses, registerStudent } from '../../../services';


const Register = () => {

	const navigate = useNavigate();
	const [supportEmail, setSupportEmail] = useState('');
	const [status, setStatus] = useState(0);

	useEffect(() => {
		const fetchEmail = async () => {
			const email = await getSupportEmail();
			setSupportEmail(email);
		};
		fetchEmail();
	}, []);

	const [name, setName] = useState();
	const [number, setNumber] = useState();
	const [email, setEmail] = useState();
	const [course, setCourse] = useState();
	const [branch, setBranch] = useState();
	const [password, setPassword] = useState();
	const [repeat, setRepeat] = useState();

	const [errorMessage, setErrorMessage] = useState("");

	const [courses, setCourses] = useState([]);
	useEffect(() => {
    const fetchCourses = async () => {
			const courses = await listCourses(null, setStatus, setErrorMessage);
			setCourses(courses);
    };
    fetchCourses();
  }, []);
	useEffect(() => {
		const selectedCourse = courses.find(c => c.id === course);
		if (!selectedCourse || selectedCourse.branches?.length === 0) {
			setBranch(null);
		}
	}, [course, courses]);


		const submit = () => {

		const data = {
			student_name: name,
			email: email,
			student_number: number,
			student_course: course,
			student_branch: branch,
			password: password,
		};

		if(registerStudent(data, setStatus, setErrorMessage)){
		}
	}


	return(
		<div id="register-student">
			<section className='d-flex flex w-100'>

				<div className='image-container d-none d-md-flex w-75' style={{backgroundImage: `url(${bg})`}}>
					<img src={logo}/>
				</div>

				<div className='form d-flex flex-column justify-content-between w-100'>
					<div className='title-container d-flex flex-column'>
						<h5 className='sub-title'>Registar</h5>
						<h1 className='title'>Aluno</h1>
					</div>

					<div className='inputs d-flex flex-column'>

						<TextInput text='Nome Completo' value={name} setValue={setName} />
						<TextInput text='Número de Aluno' type='number' value={number} setValue={setNumber} />
						<TextInput text='Email' type='email' value={email} setValue={setEmail} />
						
						<div className="d-flex flex-column flex-md-row gap-3">
							<Dropdown className='col' text='Curso' value={course} setValue={(v) => setCourse(Number(v))}>
								{courses.map((c, index) => (
									<option key={index} value={c.id}>{c.name}</option>
								))}
							</Dropdown>
							<Dropdown className='col' text='Ramo' value={branch} setValue={(v) => setBranch(Number(v))} disabled={!courses.find(c => c.id === course)?.branches?.length}>
								{(courses.find(c => c.id === course)?.branches || []).map((b) => (
									<option key={b.id_branch} value={b.id_branch}>{b.branch_name}</option>
								))}
							</Dropdown>
						</div>

						<PasswordInput text='Palavra-Passe' value={password} setValue={setPassword} />
						<PasswordInput text='Confirmar Palavra-Passe' value={repeat} setValue={setRepeat} />

            <PrimaryButton content={<h6>Registar</h6>} action={submit} />
						{errorMessage && (<p className='error-message'>{errorMessage}</p>)}
					</div>

          <div className='help text-center'>
            <p>Já tem uma conta criada? <a href="\">Faça login</a></p>
            <p>Tem dúvidas? Contacte-nos: <a href={`mailto:${supportEmail}`}>{supportEmail}</a></p>
          </div>

				</div>

			</section>
		</div>
	);

}

export default Register;