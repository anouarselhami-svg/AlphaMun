// Optional photo URLs can be supplied when real portraits become available.
const member = (name, fr, en) => ({ name, role: { fr, en }, photo: null });
export const boardLeaders = [
  member('Hajar El Khachai', 'Présidente', 'President'),
  member('Rania Aqachmar', 'Vice-présidente', 'Vice-President'),
  member('Marouane Lrhoul', 'Secrétaire général', 'Secretary-General'),
];
export const boardDepartments = [
  { id: 'academic', name: { fr: 'Département académique', en: 'Academic Department' }, members: [
    member('Miral Hatta', 'Responsable des affaires académiques', 'Head of Academic Affairs'),
    member('Lailla Addab', 'Responsable des comités', 'Head of Committees'),
    member('Yasmine Bentaleb', 'Responsable des comités', 'Head of Committees'),
  ] },
  { id: 'logistics', name: { fr: 'Département logistique', en: 'Logistics Department' }, members: [
    member('Adam Dkouik', 'Responsable du staff', 'Head of Staff'),
    member('Zineb Maftah', 'Responsable des affaires des délégués', 'Head of Delegate Affairs'),
    member('Lina Sbaybi', 'Coordinatrice de l’événement', 'Event Coordinator'),
  ] },
  { id: 'social', name: { fr: 'Département social', en: 'Social Department' }, members: [
    member('Nidal Hammioui', 'Responsable de la communication', 'Head of Communication'),
    member('Meryem Hajji', 'Responsable des médias', 'Head of Media'),
  ] },
  { id: 'financial', name: { fr: 'Département financier', en: 'Financial Department' }, members: [
    member('Asmae Ajbade', 'Responsable des partenariats', 'Head of Sponsorships'),
    member('Yasmine Alaoui', 'Trésorière', 'Treasurer'),
  ] },
];
export const boardMembers = [...boardLeaders, ...boardDepartments.flatMap(department => department.members)];
