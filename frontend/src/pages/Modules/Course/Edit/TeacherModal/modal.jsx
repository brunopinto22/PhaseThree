import { useState, useEffect } from "react";
import { Alert, CheckBox, PrimaryButton, SecundaryButton } from "../../../../../components";

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
            <table>
              <tr className='header'>
                <th><p>#</p></th>
                <th><p>Nome</p></th>
                <th><p>Email</p></th>
                <th></th>
              </tr>
              {teachers
                .map(e => (
                  <tr className='table-row' key={e.id}>
                    <th><p>{e.id_teacher}</p></th>
                    <th><p>{e.teacher_name}</p></th>
                    <th><p><a href={`mailto:${e.teacher_email}`}>{e.teacher_email}</a></p></th>
                    <th>
                      <CheckBox
                        value={tempComission.some(t => t.teacher_id === e.id_teacher)}
                        setValue={(checked) => handleToggle(e, checked)}
                      />
                    </th>
                  </tr>
                ))}
            </table>
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
