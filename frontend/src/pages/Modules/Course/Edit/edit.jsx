import './edit.css';
import React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearchParams } from "react-router-dom";
import { PrimaryButton, PrimaryButtonSmall, SecundaryButton, SecundaryButtonSmall, TextInput, TextArea, OptionButton, ColorPicker, CheckBox, Dropdown, Alert } from '../../../../components';
import { listTeachers, createCourse, editCourse, getCourse, getScientificAreas } from '../../../../services';
import CommissionModal from './TeacherModal/modal'


const RowBranch = React.memo(({ index, id, branch_name, branch_acronym, color, onChange, onDelete}) => {
	
	const handleChange = (field, value) => {
		onChange(index, field, value);
	};

	const handleDelete = () => {
    onDelete(index, id);
  }

	return(
		<tr className='table-row'>
			<th><p><input style={{ borderBottom: '1px solid var(--text-color-300)' }} onChange={e => handleChange('branch_name', e.target.value)} className='no-decor w-100' type='text' value={branch_name}/></p></th>
			<th><p><input style={{ borderBottom: '1px solid var(--text-color-300)' }} onChange={e => handleChange('branch_acronym', e.target.value)} className='no-decor w-100' type='text' value={branch_acronym}/></p></th>
			<th style={{width: 0}}><ColorPicker color={color} setColor={newColor => handleChange('color', newColor)} /></th>
			<th><OptionButton type='delete' action={handleDelete} /></th>
		</tr>
	);
})


const RowAdmin = ({ index, is_responsible, teacher_name, email, onChange, onDelete }) => {

  const handleResponsibleChange = (checked) => {
    onChange(index, 'is_responsible', checked);
  };

  return (
    <tr className='table-row'>
      <th>
        <CheckBox 
          value={is_responsible} 
          setValue={(e) => handleResponsibleChange(e)} 
        />
      </th>
      <th><p>{teacher_name}</p></th>
      <th><p><a href={`mailto:${email}`}>{email}</a></p></th>
      <th>
        <OptionButton type='remove' action={() => onDelete(index)} />
      </th>
    </tr>
  );
};



const Edit = () =>  {

	const navigate = useNavigate();
	const token = localStorage.getItem("access_token");
	const [searchParams] = useSearchParams();
	const [status, setStatus] = useState([]);
	const [error, setError] = useState([]);

	const id = searchParams.get("id");
  const isNew = searchParams.get("new");
	
	const [title, setTitle] = useState("");
	const [area, setArea] = useState("");
	const [email, setEmail] = useState("");
	const [website, setWebsite] = useState("");
	const [description, setDescription] = useState("");
	const [branches, setBranches] = useState([]);
	const [comission, setComission] = useState([]);

	const [proposals, setProposals] = useState({
		Technologies: true,
		Methodologies: true,
		Objectives: true,
	});

	const [areas, setAreas] = useState([]);
	useEffect(() => {
		const fetchAreas = async () => {
			const areas = await getScientificAreas();
			setAreas(areas);
		};
		fetchAreas();
	}, []);

	const [show, setShow] = useState(false);

	useEffect(() => {
		const token = localStorage.getItem('access_token');
		if (id && !isNew) {
			getCourse(token, id, setStatus, setError).then(courseData => {
				setTitle(courseData.course_name);
				setArea(courseData.scientific_area_id);
				setDescription(courseData.course_description);
				setWebsite(courseData.website);
				setBranches(courseData.branches);
				setEmail(courseData.commission_email);
				setComission(courseData.commission);
				setProposals({
					Technologies: courseData.technologies_active,
					Methodologies: courseData.methodologies_active,
					Objectives: courseData.objectives_active,
				});
			});
		}
	}, [id, isNew]);

	const [teachers, setTeachers] = useState([]);
	useEffect(() => {
		if (!token || !area) return;

		const fetchTeachers = async () => {
			try {
				const list = await listTeachers(token, setStatus, setError);
				setTeachers(list);
			} catch (e) {
				console.error('Error fetching teachers', e);
				setTeachers([]);
			}
		};

		fetchTeachers();
	}, [token, area]);


	const submit = () => {

		const data = {
			course_name: title,
			scientific_area: area,
			course_description: description,
			course_website: website,
			branches: branches.map(branch => ({
				branch_id: branch.id_branch,
				branch_name: branch.branch_name,
				branch_acronym: branch.branch_acronym,
				branch_color: branch.color,
			})),
			email: email,
			admins: comission.map(admin => ({
				teacher_id: admin.teacher_id,
				is_responsible: admin.is_responsible ?? false,
			})),
			technologies_active: proposals.Technologies,
			methodologies_active: proposals.Methodologies,
			objectives_active: proposals.Objectives,
		};

		if (isNew) {
			if(createCourse(token, data, setStatus, setError)){
				navigate(-1);
			}
		} else {
			if(editCourse(token, id, data, setStatus, setError))
				navigate(-1);
		}
	}
	
	const cancel = () => {
		if (window.history.length > 2)
			navigate(-1);
		else
			navigate('/');
	}


	const handleBranchChange = React.useCallback((index, field, value) => {
		setBranches(prev =>
			prev.map((b, i) =>
				i === index ? { ...b, [field]: value } : b
			)
		);
	}, []);

	const handleBranchDelete = async (index, id_branch) => {
		setBranches(prev => prev.filter((_, i) => i !== index));
	};


	const handleAdminChange = (index, field, value) => {
		if (field === 'is_responsible') {
			setComission(prev => {
				const updated = prev.map((admin, i) => ({
					...admin,
					is_responsible: i === index && value
				}));
				console.log('Updated comission:', updated);
				return updated;
			});
		}
	};

	const handleAdminDelete = async (index) => {
		const adminToDelete = comission[index];

		if (adminToDelete.teacher_id) {
		} else {
			setComission(prev => prev.filter((_, i) => i !== index));
		}
	};

	
	return(
		<>
		<div id='course' className='d-flex flex-column p-0'>
			<section className='row p-0'>
				<div className="d-flex flex-row justify-content-between align-items-center p-0">
					<h3>{isNew ? "Criar Curso" : "Editar Curso"}</h3>
				</div>
				<div className="inputs row p-0">
					<div className='inputs d-flex flex-column flex-md-row'>
						<TextInput className='w-100' text='Nome do Curso' value={title} setValue={setTitle} />
						<Dropdown className='col' text='Área Científica' value={area} setValue={setArea}>
							{areas.map((a) => (
								<option key={a.id_area} value={a.id_area}>
									{a.area_name}
								</option>
							))}
						</Dropdown>
					</div>
					<TextArea className='col-12' text='Descrição' value={description} setValue={setDescription} />
						<TextInput className='w-100' text='Website' value={website} setValue={setWebsite} />
				</div>
			</section>

			<section className='row p-0'>
				<div className="d-flex flex-row justify-content-between align-items-center p-0">
					<h4>Ramos</h4>
					<PrimaryButtonSmall action={() => {setBranches(prev => [...prev, {id_branch: `temp_${Date.now()}` ,branch_name: '', branch_acronym: '', color: 'red'} ]);}} content={<div className='d-flex flex-row gap-2'><i className="bi bi-plus-lg"></i><p>Adicionar ramo</p></div>} />
				</div>
				{branches?.length === 0 && <Alert text='Não existe nenhum ramo registado' />}
				{branches?.length > 0 &&
					<table>
						<tr className='header'>
							<th><p>Ramo</p></th>
							<th><p>Sigla</p></th>
							<th><p>Cor</p></th>
							<th className='fit-column'></th>
						</tr>
						{branches.map((branch, index) => (
							<RowBranch key={branch.id_branch} index={index} id={branch.id_branch} {...branch} onChange={handleBranchChange} onDelete={handleBranchDelete} />
						))}
					</table>
				}
			</section>

			<section className='row p-0'>
				<div className="d-flex flex-row justify-content-between align-items-center p-0">
					<h4>Comissão de Curso</h4>
					<PrimaryButtonSmall action={() => setShow(true)} content={<div className='d-flex flex-row gap-2'><i className="bi bi-plus-lg"></i><p>Adicionar membro</p></div>} />
				</div>
				<TextInput className='p-0' text='Email da Comissão' value={email} setValue={setEmail} />
				{comission?.length === 0 && <Alert text='Não existe nenhum membro registado' />}
				{comission?.length > 0 &&
					<table>
						<tr className='header'>
							<th className='fit-column text-center'><p>#</p></th>
							<th><p>Nome</p></th>
							<th><p>Email</p></th>
							<th className='fit-column'></th>
						</tr>
						{comission.map((admin, index) => (
							<RowAdmin
								key={admin.teacher_id ?? index}
								index={index}
								is_responsible={admin.is_responsible}
								teacher_name={admin.teacher_name}
								email={admin.teacher_email}
								onChange={handleAdminChange}
								onDelete={handleAdminDelete}
							/>
						))}
					</table>
				}
			</section>

			<section className="d-flex flex-column p-0">
				<h4>Definições de Propostas</h4>

				<table>
					<tr className='header'>
						<th className='fit-column'><p>Ativo</p></th>
						<th className='fit-column'><p>Secções</p></th>
						<th><p>Descrição</p></th>
					</tr>
					{Object.entries(proposals).map(([key, value], index) => (
						<tr>
							<td>
								<div className="d-flex justify-content-center">
									<CheckBox value={value}
										setValue={(newVal) => setProposals(prev => ({ ...prev, [key]: newVal })) }
									/>
								</div>
							</td>
							<td><p>{key}</p></td>
							<td style={{textWrap: "pretty"}}><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Amet quos asperiores accusamus saepe aut tenetur dolores rem, autem nulla in ab incidunt illum nostrum, doloremque modi natus! Recusandae, aspernatur magnam.</p></td>
						</tr>
					))}
				</table>
			</section>

			<section className="buttons d-flex flex-row gap-3 col-sm-12 col-md-5 p-0">
				<PrimaryButton action={submit} content={<h6>{isNew ? "Submeter" : "Guardar"}</h6>} />
				<SecundaryButton action={cancel} content={<h6>Cancelar</h6>} />
			</section>

		</div>
		

		<CommissionModal
			show={show}
			setShow={setShow}
			area={area}
			teachers={teachers}
			comission={comission}
			setComission={setComission}
		/>

		</>
	);

}

export default Edit;