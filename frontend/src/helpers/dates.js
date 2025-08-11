export function isDateInLectiveYear(year, date) {
  if (!date) return false;

  const d = new Date(date);
  const dateYear = d.getFullYear();
	const yearNum = Number(year);

  return dateYear === yearNum || dateYear === yearNum + 1;
}

export function toDate(dateStr) {
	return dateStr ? new Date(dateStr) : null;
}

export function formatDate(dateStr) {
	if (!dateStr) return "dd/mm/aaaa";
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-PT');
}