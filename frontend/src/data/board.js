// Portraits are served directly from the public images directory.
const member = (name, fr, en, photo) => ({ name, role: { fr, en }, photo: photo ? `/images/team/${photo}.png` : null });
export const boardLeaders = [
  member('Hajar El Khachai', 'Présidente', 'President','hajar-el-khachai'),
  member('Rania Aqachmar', 'Vice-présidente', 'Vice-President','rania-aqachmar'),
  member('Marouane Lrhoul', 'Secrétaire général', 'Secretary-General','marouane-lrhoul'),
];
export const boardDepartments = [
  { id: 'academic', name: { fr: 'Département académique', en: 'Academic Department' }, members: [
    member('Miral Hatta', 'Responsable des affaires académiques', 'Head of Academic Affairs','miral-hatta'),
    member('Laila Addab', 'Responsable des comités', 'Head of Committees','laila-addab'),
    member('Yasmine Bentaleb', 'Responsable des comités', 'Head of Committees','yasmine-bentaleb'),
  ] },
  { id: 'logistics', name: { fr: 'Département logistique', en: 'Logistics Department' }, members: [
    member('Adam Dekiouak', 'Responsable du staff', 'Head of Staff','adam-dekiouak'),
    member('Zineb Maftah', 'Responsable des affaires des délégués', 'Head of Delegate Affairs','zineb-maftah'),
    member('Lina Sbaybi', 'Coordinatrice de l’événement', 'Event Coordinator','lina-sbaybi'),
  ] },
  { id: 'social', name: { fr: 'Département social', en: 'Social Department' }, members: [
    member('Nidal ElHammioui', 'Responsable de la communication', 'Head of Communication','nidal-elhammioui'),
    member('Meryem Hajji', 'Responsable des médias', 'Head of Media','meryem-hajji'),
  ] },
  { id: 'financial', name: { fr: 'Département financier', en: 'Financial Department' }, members: [
    member('Asmae Ajabbade', 'Responsable des partenariats', 'Head of Sponsorships','asmae-ajabbade'),
    member('Yasmine Alaoui', 'Trésorière', 'Treasurer','yasmine-alaoui'),
  ] },
];
export const boardMembers = [...boardLeaders, ...boardDepartments.flatMap(department => department.members)];
