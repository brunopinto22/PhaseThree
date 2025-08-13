import './view.css';
import default_pfp from './../../../../assets/imgs/default_pfp.jpg';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PrimaryButton, Alert } from '../../../../components';
import { useContext, useEffect, useState } from 'react';
import { UserContext } from '../../../../contexts';
import { getStudent } from '../../../../services';

function View() {

	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const { userInfo } = useContext(UserContext);
	const [status, setStatus] = useState(null);
	const [error, setError] = useState(null);
  const id = searchParams.get('id');

	const [studentData, setStudentData] = useState({
		pfp: null,
		active: true,
		name: "",
		student_number: null,
		email: "",
		nif: null,
		gender: "",
		nationality: "",
		ident_type: "",
		ident_doc: null,
		address: "",
		contact: "",
		year: null,
		ects: null,
		average: null,
		subjects_done: null,
		course: {id: null, name: ""},
		branch: {id: null, name: ""},
		calendar: {id: null, title: ""},
		subjects: [],
		curriculum: null,
	});
	

	useEffect(() => {
		async function fetchStudent() {
			if (!id) {
				navigate('/pagenotfound');
				return;
			}
			const data = await getStudent(userInfo.token, id, setStatus, setError);

			if (status === 404) {
				navigate('/pagenotfound');
				return;
			}
			if (status === 200 && data) {
				setStudentData(data);
			}
		}
		fetchStudent();
	}, [id, userInfo, navigate, status]);

	const pfp = studentData.pfp;
	const fullName = studentData.name;
	const parts = fullName.trim().split(" ");
	const shortName = parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1]}` : fullName;
	const email = studentData.email;
	const nationality = studentData.nationality;
	const idType = studentData.ident_type;
	const idNumber = studentData.ident_doc;
	const nif = studentData.nif;
	const gender = studentData.gender;
	const address = studentData.address;
	const contact = studentData.contact;

	const number = studentData.student_number;
	const course = studentData.course?.name;
	const branch = studentData.branch?.name;
	const year = studentData.year;
	const average = studentData.average;
	const subjectsDone = studentData.subjects_done;
	const ects = studentData.ects;

	const todo = studentData.subjects.map(({ name, state }) => ({ name, state }));

	const canEdit = userInfo?.role === "admin" || (userInfo?.role === "student" && userInfo.id === id) || userInfo?.perms["Alunos"].edit;
	// TODO : abrir CV


	return(
		<div id='profile' className='row'>

			<div className="profile-card d-flex flex-column col-sm-12 col-md-4">

				<div className="card d-flex flex-row">
					<div className="profile-picture" style={{ backgroundImage: `url(${pfp === null ? default_pfp : pfp})` }}></div>
					<div className="profile-title d-flex flex-column justify-content-center">
						<h3>{shortName}</h3>
						<h5>Nº {number}</h5>
					</div>
				</div>

				<div className="options">
					<PrimaryButton content={<h6>Currículo</h6>}/>
					{canEdit && (<PrimaryButton action={() => navigate("/student/edit?id="+id)} content={<h6>Editar Perfil</h6>}/>)}
				</div>

			</div>

			<div className="profile-info col-sm-12 col-md">

				<div className="section">
					<h4>Dados Pessoais</h4>
					<div className="content d-flex flex-column">
						<div className="content-row"><p><b>Nome Completo: </b>{fullName}</p></div>
						<div className="content-row"><p><b>Email: </b>{email}</p></div>
						<div className="content-row"><p><b>Nacionalidade: </b>{nationality}</p></div>
						<div className="content-row"><p><b>Tipo de documento: </b>{idType}</p></div>
						<div className="content-row"><p><b>Documento de identificação: </b>{idNumber}</p></div>
						<div className="content-row"><p><b>NIF: </b>{nif}</p></div>
						<div className="content-row"><p><b>Género: </b>{gender}</p></div>
						<div className="content-row"><p><b>Morada: </b>{address}</p></div>
						<div className="content-row"><p><b>Contacto: </b>{contact}</p></div>
					</div>
				</div>

				<div className="section">
					<h4>Dados Curriculares</h4>
					<div className="content d-flex flex-column">
						<div className="content-row"><p><b>Número de aluno: </b>{number}</p></div>
						<div className="content-row"><p><b>Curso: </b>{course}</p></div>
						{branch && (<div className="content-row"><p><b>Ramo: </b>{branch}</p></div>)}
						<div className="content-row"><p><b>Ano Curricular: </b>{year}</p></div>
						<div className="content-row"><p><b>Média: </b>{average}</p></div>
						<div className="content-row"><p><b>Unidades Curriculares Realizadas: </b>{subjectsDone}</p></div>
						<div className="content-row"><p><b>ECTS Realizados: </b>{ects}</p></div>
					</div>
					<div className="content d-flex flex-column">
						<h6>Unidades Curriculares por fazer</h6>
						{todo.length == 0 && (<Alert type='info' text='Não tem nenhuma Unidade Curricular registada.' />)}

						{todo.length > 0 && (
							<div className="content-list">
								<div className="content-row header p-1"><b>Nome</b><b>Estado</b></div>
								{todo.map(subject =>(
									<div className="content-row p-1"><p>{subject.name}</p><b className={subject.state == 2 ? "red" : "yellow"}>{subject.state == 2 ? "Por fazer" : "A realizar em simultâneo"}</b></div>
								))}
							</div>
						)}

					</div>
				</div>

			</div>

		</div>
	);

}

export default View;