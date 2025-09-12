export function exportProposalsToCSV(list, fileName) {
  if (!list || list.length === 0) {
    console.warn("Lista vazia");
    return;
  }

  const headers = [
    "ID",
    "Tipo",
    "Título",
    "Empresa",
    "Localização",
    "Calendário",
    "Curso",
    "Vagas",
    "Vagas Ocupadas",
  ];

  const rows = list.map(obj => {
    const row = [
      obj.proposal_number ?? "",
      obj.type === 1 ? "Estágio" : "Projeto",
      obj.title ?? "",
      obj.company.name ?? "",
      obj.location ?? "",
      obj.calendar?.title ?? "",
      obj.course?.name ?? "",
      obj.slots ?? "",
      obj.taken ?? "",
    ];

    return row.map(value => {
      if (typeof value === "string") {
        value = value.replace(/"/g, '""');
        if (value.includes(",") || value.includes("\n")) {
          value = `"${value}"`;
        }
      }
      return value;
    }).join(",");
  });

  const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${fileName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


export function exportToCSV(list, fileName) {
  if (!list || list.length === 0) {
    console.warn("Empty list");
    return;
  }

  const flattenObject = (obj, parentKey = "") => {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      const newKey = parentKey ? `${parentKey}.${key}` : key;
      if (value && typeof value === "object" && !Array.isArray(value)) {
        Object.assign(acc, flattenObject(value, newKey));
      } else {
        acc[newKey] = value;
      }
      return acc;
    }, {});
  };

  const flattenedList = list.map(item => flattenObject(item));

  const headers = [
    ...new Set(flattenedList.flatMap(obj => Object.keys(obj)))
  ];

  const rows = flattenedList.map(obj =>
    headers.map(field => {
      let value = obj[field] ?? "";
      if (typeof value === "string") {
        value = value.replace(/"/g, '""');
        if (value.includes(",") || value.includes("\n")) {
          value = `"${value}"`;
        }
      }
      return value;
    }).join(",")
  );

  const csvContent = [headers.join(","), ...rows].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${fileName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
