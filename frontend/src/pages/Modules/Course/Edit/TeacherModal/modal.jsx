import { useState, useEffect } from "react";
import { Alert, CheckBox, PrimaryButton, SecundaryButton } from "../../../../../components";
import { useDebounce } from "../../../../../utils";

const CommissionModal = ({show, setShow, area, teachers, comission, setComission}) => {

  const [tempComission, setTempComission] = useState([]);

  useEffect(() => {
    if (show) setTempComission([...comission]);
  }, [show]);

  const handleToggle = (teacher, checked) => {
    setTempComission(prev => {
      if (checked) {
        return [...prev, {
          teacher_id: teacher.id_teacher,
          teacher_name: teacher.teacher_name,
          teacher_email: teacher.teacher_email,
          responsible: false,
        }];
      } else {
        return prev.filter(t => t.teacher_id !== teacher.id_teacher);
      }
    });
  };


	const [name, setName] = useState(null);
	const [email, setEmail] = useState(null);

	const debouncedName = useDebounce(name, 300);
	const debouncedEmail = useDebounce(email, 300);

	useEffect(() => {
		updateFilter('name', debouncedName);
		updateFilter('email', debouncedEmail);
	}, [debouncedName, debouncedEmail]);

	const [filters, setFilters] = useState({
		active: false,
		name: null,
		email: null,
	});
	const updateFilter = (key, value) => {
		setFilters(prev => ({
			...prev,
			[key]: value === 'all' ? null : value
		}));
	};
	const getFilteredList = () => {
		return teachers.filter((item) => {
			if (filters.active === false && !item.active) return false;
			
			return (
				(filters.name === null || item.teacher_name.toLowerCase().includes(filters.name.toLowerCase())) &&
				(filters.email === null || item.teacher_email.toLowerCase().includes(filters.email.toLowerCase()))
			);
		});
	};


  return (
    <div className={`overlay ${show ? 'd-flex justify-content-center align-items-center' : 'd-none'}`}>
      <div className='pop-up col-sm-11 col-md-6 d-flex flex-column gap-4'>
        <div className="d-flex flex-row justify-content-between gap-4">
          <h6>Adicionar membro à comissão</h6>
          <i className="bi bi-x-lg close" onClick={() => setShow(false)}></i>
        </div>

        {!area ? (
          <Alert type='danger' text="Área não selecionada" />
        ) : teachers.length === 0 ? (
          <Alert text="Nenhum docente encontrado" />
        ) : (
          <div className="view">
            <table className="w-100">
              <tr className='header'>
                <th></th>
								<th><p><input placeholder='Nome do Docente' onChange={(e) => setName(e.target.value)}/></p></th>
								<th><p><input placeholder='Email' onChange={(e) => setEmail(e.target.value)}/></p></th>
              </tr>
              {getFilteredList()
                .map(e => (
                  <tr className='table-row' key={e.id}>
										<th className="fit-column">
                      <CheckBox
                        value={tempComission.some(t => t.teacher_id === e.id_teacher)}
                        setValue={(checked) => handleToggle(e, checked)}
                      />
                    </th>
                    <th><p>{e.teacher_name}</p></th>
                    <th><p><a href={`mailto:${e.teacher_email}`}>{e.teacher_email}</a></p></th>
                  </tr>
                ))}
            </table>

						{teachers?.length > 0 && getFilteredList().length === 0 && <Alert text='Não foi encontrado nenhuma Docente' />}

          </div>
        )}

        <div className="d-flex flex-row gap-2 align-items-end justify-content-end">
          <PrimaryButton small
            action={() => {
							const updatedComission = tempComission.map((member, index) => ({
								...member,
								is_responsible: index === 0,
							}));
							setComission(updatedComission);
							setShow(false);
						}}
            content={<div className='d-flex flex-row gap-2'><i className="bi bi-plus-lg"></i><p>Adicionar</p></div>}
          />
          <SecundaryButton small
            action={() => {
              setTempComission([]);
              setShow(false);
            }}
            content={<p>Descartar</p>}
          />
        </div>
      </div>
    </div>
  );
};

export default CommissionModal;
