import './view.css';
import default_pfp from './../../../../assets/imgs/default_pfp.jpg';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PrimaryButton, Alert } from '../../../../components';

function View() {

	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
  const id = searchParams.get('id');

	const profilePicture = null;
	const fullName = "Tiago Manuel Ferreira";
	const parts = fullName.trim().split(" ");
	const shortName = parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1]}` : fullName;
	const email = "a2020123456@isec.pt";
	const nacionality = "Portuguesa";
	const idType = "Cartao de Cidadão";
	const idNumber = 123456789;
	const nif = 123456789;
	const gender = "Masculino";
	const address = "Rua XPTO, Coimbra 123-123";
	const contact = 912345678;

	const number = 2020123456;
	const course = "Licenciatura em Engenharia Informática";
	const branch = "Desenvolvimento de Aplicações";
	const year = 3;
	const average = 15;
	const subjectsDone = 27;
	const ects = 135;

	const todo = [{name: "Cadeira 1", state: 1},{name: "Cadeira 2", state: 2}];

	// TODO : abrir CV
	// TODO : getStudent(id)
	// TODO : verificar se tem permissão / é o próprio
	const canEdit = true;

	return(
		<div id='profile' className='row'>

			<div className="profile-card d-flex flex-column col-sm-12 col-md-4">

				<div className="card d-flex flex-row">
					<div className="profile-picture" style={{backgroundImage: 'url(' + default_pfp +')'}}></div>
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
						<div className="content-row"><p><b>Nacionalidade: </b>{nacionality}</p></div>
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
									<div className="content-row p-1"><p>{subject.name}</p><b className={subject.state == 1 ? "red" : "yellow"}>{subject.state == 1 ? "Por fazer" : "A realizar em simultâneo"}</b></div>
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