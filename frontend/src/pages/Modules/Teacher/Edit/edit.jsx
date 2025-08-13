import './edit.css';
import default_pfp from './../../../../assets/imgs/default_pfp.jpg';

import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearchParams } from "react-router-dom";
import { PrimaryButton, PrimaryButtonSmall, SecundaryButton, TextInput, Dropdown, CheckBox } from '../../../../components';
import { createTeacher, editTeacher, getTeacher, getScientificAreas } from '../../../../services';
import { UserContext } from '../../../../contexts';

const Edit = () =>  {

	const navigate = useNavigate();
	const { userInfo } = useContext(UserContext);

	const [searchParams] = useSearchParams();
	const token = localStorage.getItem("access_token");
	const [status, setStatus] = useState([]);
	const [error, setError] = useState([]);

	const id = searchParams.get("id");
  const isNew = searchParams.get("new");
	
	const [active, setActive] = useState(null);
	const [profilePicture, setProfilePicture] = useState(null);
	const [fullName, setFullName] = useState(null);
	const [originalEmail, setOriginalEmail] = useState(null);
	const [email, setEmail] = useState(null);
	const [category, setCategory] = useState(null);

	const [area, setArea] = useState(null);

	const [areas, setAreas] = useState([]);
	useEffect(() => {
		const fetchAreas = async () => {
			const areas = await getScientificAreas();
			setAreas(areas);
		};
		fetchAreas();
	}, []);

	const [perms, setPerms] = useState({
		Calendários: { view: true, edit: false, delete: false },
		Cursos: { view: true, edit: false, delete: false },
		Alunos: { view: true, edit: false, delete: false },
		Docentes: { view: true, edit: false, delete: false },
		Empresas: { view: true, edit: false, delete: false },
		Propostas: { view: true, edit: false, delete: false },
		Candidaturas: { view: true, edit: false, delete: false },
	});

	const canEdit = userInfo?.role === "admin" || (userInfo?.perms["Docentes"].edit && userInfo?.id !== id);

	useEffect(() => {
		const token = localStorage.getItem('access_token');
		if (id && !isNew) {
			getTeacher(token, id, setStatus, setError).then(data => {
				setActive(data.active)
				setProfilePicture(data.pfp || null);
				setFullName(data.teacher_name);
				setEmail(data.teacher_email);
				setOriginalEmail(data.teacher_email);
				setArea(data.scientific_area_id);
				setCategory(data.teacher_category);
				setPerms(data.permissions);
			});
		}
	}, [id, isNew]);


	const submit = () => {
		const data = {
			active: active,
			email: email,
			name: fullName,
			area: area,
			category: category,
			permissions: perms,
		};

		if (isNew) {
			if(createTeacher(token, data, setStatus, setError))
				navigate(-1);
		} else {
			if(editTeacher(token, id, data, setStatus, setError))
				navigate(-1);
		}
	}
	
	const cancel = () => {
		if (window.history.length > 2)
			navigate(-1);
		else
			navigate('/');
	}


	return(
		<div id='teacher' className='d-flex flex-column'>
			<section className='row p-0'>
				<h4>Perfil</h4>
				<div className="profile d-flex flex-column flex-md-row p-0 col-sm-12 col-md-4">
					<div className="profile-picture h-100" style={{backgroundImage: `url(${ profilePicture ? profilePicture : default_pfp })`}}></div>
					<div className="options d-flex flex-column justify-content-center w-100">
						{(userInfo?.role === "admin" || (userInfo?.role === "teacher" && userInfo.id !== id) || userInfo?.perms["Docentes"].edit) && <CheckBox value={active} setValue={setActive} label={"Ativo"} />}
						<PrimaryButtonSmall content={<p>Alterar Foto de Perfil</p>} />
						<PrimaryButtonSmall content={<p>Alterar Palavra-Passe</p>} action={() => navigate("/setPassword", { state: { email: originalEmail } })} />
					</div>
				</div>
			</section>

			<section className='row p-0'>
				<h4>Dados Pessoais</h4>
				<div className='row'>
					
					<div className="inputs d-flex flex-column col-sm-12 col-md-6">
						<TextInput text='Nome Completo' value={fullName} setValue={setFullName} />
						<TextInput text='Email' type='email' value={email} setValue={setEmail} />
					</div>

					<div className="inputs d-flex flex-column col-sm-12 col-md-6">
						<Dropdown className='col' text='Área Científica' value={area} setValue={setArea}>
							{areas.map((a) => (
								<option key={a.id_area} value={a.id_area}>
									{a.area_name}
								</option>
							))}
						</Dropdown>
						<Dropdown className='col' text='Categoria' value={category} setValue={setCategory}>
							<option value="Professor Coordenador Principal com Agregação">Professor Coordenador Principal com Agregação</option>
							<option value="Professor Coordenador Principal">Professor Coordenador Principal</option>
							<option value="Professor Coordenador com Agregação">Professor Coordenador com Agregação</option>
							<option value="Professor Coordenador">Professor Coordenador</option>
							<option value="Professor Adjunto com Agregação">Professor Adjunto com Agregação</option>
							<option value="Professor Adjunto">Professor Adjunto</option>
							<option value="Assistente">Assistente</option>
							<option value="Professor Coordenador convidado">Professor Coordenador convidado</option>
							<option value="Professor Adjunto convidado">Professor Adjunto convidado</option>
							<option value="Assistente convidado">Assistente convidado</option>
						</Dropdown>
					</div>

				</div>
			</section>

			{canEdit && (
				<section className='row p-0'>
					<h4>Permissões</h4>
					<table>
						<tr className='header'>
							<th><p>Módulo</p></th>
							<th><p>Ver</p></th>
							<th><p>Editar</p></th>
							<th><p>Remover</p></th>
						</tr>

						{Object.entries(perms).map(([key, value], index) => (
							<tr className='table-row' key={key}>
								<th><p>{key}</p></th>
								<th style={{ width: 0 }}>
									<CheckBox className='justify-content-center' value={value.view}
										setValue={(newVal) =>
											setPerms(prev => ({ ...prev, [key]: { ...prev[key], view: newVal } })) }
									/>
								</th>
								<th style={{ width: 0 }}>
									<CheckBox className='justify-content-center' value={value.edit}
										setValue={(newVal) =>
											setPerms(prev => ({ ...prev, [key]: { ...prev[key], edit: newVal } })) }
									/>
								</th>
								<th style={{ width: 0 }}>
									<CheckBox className='justify-content-center' value={value.delete}
										setValue={(newVal) =>
											setPerms(prev => ({ ...prev, [key]: { ...prev[key], delete: newVal } })) }
									/>
								</th>
							</tr>
						))}
						
					</table>
				</section>
			)}

			<section className="buttons d-flex flex-row gap-3 col-sm-12 col-md-5 p-0">
				<PrimaryButton action={submit} content={<h6>Guardar</h6>} />
				<SecundaryButton action={cancel} content={<h6>Cancelar</h6>} />
			</section>

			{error && <p className='error-message'>{error}</p>}
		</div>
	);

}

export default Edit;