import './settings.css';
import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { OptionButton, Alert, PrimaryButtonSmall, PasswordInput, PrimaryButton, SecundaryButton, TextInput } from '../../components';
import { getScientificAreas, addScientificArea, getSupportEmail, deleteScientificArea } from '../../helpers';
import { UserContext } from '../../contexts';

const Settings = () => {

	const navigate = useNavigate();
	const { userInfo } = useContext(UserContext);
	const [reloadAreas, setReloadAreas] = useState(false);

	const [seeAccounts, setSeeAccounts] = useState(true);
	const [show, setShow] = useState(false);
	const [newName, setNewName] = useState(null);

	const [seeAdmin, setSeeAdmin] = useState(true);
	const [students, setStudents] = useState("aluno");
	const [teachers, setTeachers] = useState("docente");
	const [representatives, setRepresentatives] = useState("representante");

	const [seeAreas, setSeeAreas] = useState(true);
	const [areas, setAreas] = useState([]);
	useEffect(() => {
		const fetchAreas = async () => {
			const areas = await getScientificAreas();
			setAreas(areas);
		};
		fetchAreas();
	}, [reloadAreas]);

	const [email, setEmail] = useState("");
	useEffect(() => {
		const fetchEmail = async () => {
			const email = await getSupportEmail();
			setEmail(email);
		};
		fetchEmail();
	}, []);

	const submit = () => {
		// TODO : submeter alterações do adim
	}

	const cancel = () => {
		navigate(-1);
	}



	return(
		<>
		<div id="settings" className='d-flex flex-column'>

			<div className="title">
				<h2>Definições</h2>
			</div>

			<div id="admin" className="d-flex flex-column">
				<div className="d-flex flex-row justify-content-between align-items-center">
					<div className="d-flex flex-row align-content-center">
						<h4 className='title d-flex flex-row align-items-center gap-2 noselect' style={{cursor: "default"}} onClick={() => setSeeAdmin(!seeAdmin)}>
							<i className={`toggle-collapse bi bi-chevron-down`} style={{ transform: `rotateZ(${seeAdmin ? "0" : "-90deg"})` }}></i>
							<span>Conta</span>
						</h4>
					</div>
				</div>
				<div className={`collapsible ${seeAdmin ? "" : "collapse"}`}>

					<div className="d-flex flex-column flex-md-row align-items-end gap-2">
						<TextInput className="col" text='Email de suporte' value={email} setValue={setEmail} />
						<PrimaryButtonSmall className='h-100' content={<p>Alterar Palavra-Passe</p>} action={() => navigate("/setPassword", { state: { email:"admin" } })} />
					</div>

				</div>
			</div>

			<div id="accounts" className="d-flex flex-column">
				<div className="d-flex flex-row justify-content-between align-items-center">
					<div className="d-flex flex-row align-content-center">
						<h4 className='title d-flex flex-row align-items-center gap-2 noselect' style={{cursor: "default"}} onClick={() => setSeeAccounts(!seeAccounts)}>
							<i className={`toggle-collapse bi bi-chevron-down`} style={{ transform: `rotateZ(${seeAccounts ? "0" : "-90deg"})` }}></i>
							<span>Definições de Contas</span>
						</h4>
					</div>
				</div>
				<div className={`collapsible ${seeAccounts ? "" : "collapse"}`}>

					<h5 className='sub-title'>Palavras-Passe:</h5>

					<div className="d-flex flex-column flex-md-row gap-2">
						<PasswordInput className="col" text='Alunos' value={students} setValue={setStudents} />
						<PasswordInput className="col" text='Docentes' value={teachers} setValue={setTeachers} />
						<PasswordInput className="col" text='Representantes' value={representatives} setValue={setRepresentatives} />
					</div>

				</div>
			</div>
			
			<div id="scientific-areas" className="d-flex flex-column">
				<div className="d-flex flex-row justify-content-between align-items-center">
					<div className="d-flex flex-row align-content-center">
						<h4 className='title d-flex flex-row align-items-center gap-2 noselect' style={{cursor: "default"}} onClick={() => setSeeAreas(!seeAreas)}>
							<i className={`toggle-collapse bi bi-chevron-down`} style={{ transform: `rotateZ(${seeAreas ? "0" : "-90deg"})` }}></i>
							<span>Áreas Científicas</span>
						</h4>
					</div>
					<PrimaryButtonSmall
						action={() => setShow(true)}
					 content={<div className='d-flex flex-row gap-2'><i className="bi bi-plus-lg"></i><p>Adicionar área</p></div>}
					 />
				</div>
				<div className={`collapsible ${seeAreas ? "" : "collapse"}`}>

					{areas.length === 0 && <Alert text='Não existe nenhuma área científica de momento' />}

					{areas.length > 0 && (
						<table>
							<tr className='header'>
								<th><p>Designação</p></th>
								<th className='fit-column'><p>Cursos</p></th>
								<th className='fit-column'><p>Docentes</p></th>
								<th className='fit-column'></th>
							</tr>

							{areas.map((a, index) => (
								<tr class="table-row">
									<th><p>{a.area_name}</p></th>
									<th className='text-center'><p>{a.n_courses}</p></th>
									<th className='text-center'><p>{a.n_teachers}</p></th>
									<th><OptionButton type='delete' action={async () => { await deleteScientificArea(localStorage.getItem("access_token"), a.id_area); setReloadAreas(prev => !prev);} } /></th>
								</tr>
							))}
							
						</table>
					)}
				</div>
			</div>

			<section className="buttons d-flex flex-row gap-3 col-sm-12 col-md-5 p-0">
				<PrimaryButton action={submit} content={<h6>Guardar</h6>} />
				<SecundaryButton action={cancel} content={<h6>Cancelar</h6>} />
			</section>

		</div>

		<div className={`overlay ${show ? 'd-flex justify-content-center align-items-center' : 'd-none'}`}>
			<div className='pop-up col-sm-11 col-md-6 d-flex flex-column gap-4'>
				<div className="d-flex flex-row justify-content-between gap-4">
					<TextInput className='col' text='Nome da Nova Área' value={newName} setValue={setNewName} />
					<i className="bi bi-x-lg close" onClick={() => setShow(false)}></i>
				</div>
				<PrimaryButtonSmall
					disabled={newName === null || newName === ""}
					action={async () => { await addScientificArea(localStorage.getItem("access_token"), newName); setNewName(""); setShow(false); setReloadAreas(prev => !prev); }}
					style={{width: 'fit-content'}} content={<p>Submeter</p>}
				/>
			</div>
		</div>
		</>
	);

}

export default Settings;