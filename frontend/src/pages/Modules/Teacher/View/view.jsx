import './view.css';
import React, { useState, useEffect, useContext } from 'react';
import default_pfp from './../../../../assets/imgs/default_pfp.jpg';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckBox, PrimaryButton } from '../../../../components';
import { getTeacher } from '../../../../services';
import { UserContext } from '../../../../contexts';

function View() {

	const navigate = useNavigate();
	const { userInfo } = useContext(UserContext);

	const [status, setStatus] = useState([]);
	const [error, setError] = useState([]);
	const [searchParams] = useSearchParams();
  const id = searchParams.get('id');

	const [teacherData, setTeacherData] = useState({
		active: false,
		pfp: null,
		teacher_name: "",
		teacher_category: "",
		teacher_email: "",
		scientific_area_name: "",
		permissions: {
			Calendars: { view: false, edit: false, delete: false },
			Course: { view: false, edit: false, delete: false },
			Students: { view: false, edit: false, delete: false },
			Teachers: { view: false, edit: false, delete: false },
			Companies: { view: false, edit: false, delete: false },
			Proposals: { view: false, edit: false, delete: false },
			Candidatures: { view: false, edit: false, delete: false },
		},
		commissions: [],
	});

  useEffect(() => {
    async function fetchTeacher() {
      if (!id) {
        navigate('/pagenotfound');
        return;
      }
      const data = await getTeacher(userInfo.token, id, setStatus, setError);

      if (status === 404) {
        navigate('/pagenotfound');
        return;
      }
      if (status === 200 && data) {
        setTeacherData(data);
      }
    }
    fetchTeacher();
  }, [id, userInfo, navigate, status]);


  const active = teacherData.active;
  const pfp = teacherData.pfp;
  const fullName = teacherData.teacher_name;
  const parts = fullName.trim().split(" ");
  const shortName = parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1]}` : fullName;
  const email = teacherData.teacher_email;
  const category = teacherData.teacher_category;
  const area = teacherData.scientific_area_name;
  const commissions = teacherData.commissions;

  const perms = teacherData.permissions;

	const canEdit = userInfo?.role === "admin" || (userInfo?.role === "teacher" && userInfo.id === id) || userInfo?.perms["Docentes"].edit;


	return(
		<div id='profile' className='row'>

			<div className="profile-card d-flex flex-column col-sm-12 col-md-4">

				<div className="card d-flex flex-row">
					<div className="profile-picture" style={{ backgroundImage: `url(${pfp === null ? default_pfp : pfp})` }}></div>
					<div className="profile-title d-flex flex-column justify-content-center">
						<h3>{shortName}</h3>
						<h5>{category}</h5>
					</div>
				</div>

				<div className="options">
					{canEdit && (<PrimaryButton action={() => navigate("/teacher/edit?id="+id)} content={<h6>Editar Perfil</h6>}/>)}
				</div>

			</div>

			<div className="profile-info col-sm-12 col-md">

				<div className="section">
					<h4>Dados Pessoais</h4>
					<div className="content d-flex flex-column">
						<div className="content-row"><p><b>Nome Completo: </b>{fullName}</p></div>
						<div className="content-row"><p><b>Categoria: </b>{category}</p></div>
						<div className="content-row"><p><b>Área científica: </b>{area}</p></div>
						<div className="content-row"><p><b>Email: </b>{email}</p></div>
						{commissions && commissions.length > 0 && (
							<div className="content-row">
								<p>
									<b>{commissions.length === 1 ? "Comissão" : "Comissões"}: </b>
									{commissions.length === 1 ? (
										<a href="" onClick={() => navigate("/course/view?id="+commissions[0].id_course)}>{commissions[0].course_name}</a>
									) : (
										commissions.map((c, i) => (
											<p key={c.course_name}>
												<a href="" onClick={() => navigate("/course/view?id="+c.id_course)}>{c.course_name}</a>
												{i < commissions.length - 1 && ", "}
											</p>
										))
									)}
								</p>
							</div>
						)}
					</div>
				</div>

				{perms && <div className="section">
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
								<th style={{ width: 0, textAlign: "center" }}>
									<CheckBox className='justify-content-center' value={value.view} disabledClick={true} />
								</th>
								<th style={{ width: 0, textAlign: "center" }}>
									<CheckBox className='justify-content-center' value={value.edit} disabledClick={true} />
								</th>
								<th style={{ width: 0, textAlign: "center" }}>
									<CheckBox className='justify-content-center' value={value.delete} disabledClick={true} />
								</th>
							</tr>
						))}
						
					</table>
				</div>}

			</div>

		</div>
	);

}

export default View;