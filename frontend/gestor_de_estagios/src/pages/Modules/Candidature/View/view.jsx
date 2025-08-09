import './view.css';
import default_pfp from './../../../../assets/imgs/default_pfp.jpg';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { PrimaryButton, OptionButton, State, Alert, ProposalCard, StateTracker } from '../../../../components';

// TODO : ver se fica assim só para o ADMIN ou adaptar para ficar "igual" ao do aluno e ser clicavel os "states"
// TODO : ao clicalr no < que Colocado tirar o colocado do state da proposta

function View() {

	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
  const id = searchParams.get('id');


	const profilePicture = null;
	const fullName = "Tiago Manuel Ferreira";
	const parts = fullName.trim().split(" ");
	const shortName = parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1]}` : fullName;
	const number = 2020123456;
	const idStudent = 1;

	const state = 3;
	const proposalName = "Desenvolvimento de aplicações web";
	const companyName = "TekFusion";
	const companyid = 1;

	const [list, setList] = useState([
		{
			id: 1,
			companyName: "TekFusion",
      proposalName: "Desenvolvimento de aplicações web",
			state: 1,
		},
		{
			id: 2,
			companyName: "TekFusion",
      proposalName: "Desenvolvimento de aplicações web",
			state: 2,
		},
		{
			id: 3,
			companyName: "TekFusion",
      proposalName: "Desenvolvimento de aplicações web",
			state: 3,
		},
	]);



	const perms = {
		Calendars: { view: true, edit: false, delete: false },
		Course: { view: true, edit: false, delete: false },
		Students: { view: true, edit: false, delete: false },
		Teachers: { view: true, edit: false, delete: false },
		Companies: { view: true, edit: false, delete: false },
		Proposals: { view: true, edit: false, delete: false },
		Candidatures: { view: true, edit: false, delete: false },
	};

	// TODO : getCandidature(id)

	const isAdmin = true;

	const [seeP, setSeeP] = useState(false);

	return(
		<div id='candidature' className='d-flex flex-column'>

			<div className="header d-flex flex-column">
				<h3 className='title'>Estado da Candidatura</h3>
				{state >= 2 && <h6>{proposalName} <span className='text-link' onClick={() => navigate("/company/view?id=" + idStudent)}>@{companyName}</span></h6>}
				<h6 className='sub-title text-link' onClick={() => navigate("/student/view?id=" + idStudent)}>{shortName} nº{number}</h6>
			</div>

			<StateTracker currentState={state} />

			<div className='proposals d-flex flex-column gap-4'>
				<div className="d-flex flex-row align-content-center">
					<h4 className='d-flex flex-row align-items-center gap-2 noselect' style={{cursor: "default"}} onClick={() => setSeeP(!seeP)}>
						<i className={`toggle-collapse bi bi-chevron-down`} style={{ transform: `rotateZ(${seeP ? "0" : "-90deg"})` }}></i>
						<span>Propostas</span>
					</h4>
				</div>
				<div className={`collapsible ${seeP ? "" : "collapse"}`}>
					<div className="d-flex flex-wrap gap-3">
						<ProposalCard />
						<ProposalCard state='accepted' />
						<ProposalCard state='rejected' />
						<ProposalCard disabled={true} />
					</div>
				</div>
			</div>

			{isAdmin && (
				<div className="col">
					<PrimaryButton content={<h6>Editar Candidatura</h6>} action={() => navigate("/candidature/edit?id="+ id)} />
				</div>
			)}

		</div>
	);

}

export default View;