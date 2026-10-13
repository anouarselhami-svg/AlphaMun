// Debate language is independent from the site's display language.
// Supply logo URLs only after checking the acronym in the actual image.
const rows = [
 ['INTERPOL','en',20,true,'Organisation internationale de police criminelle','International Criminal Police Organization','Facilite la coopération entre les polices pour lutter contre la criminalité internationale.','Facilitates cooperation between police forces to combat international crime.','S(1)'],
 ['INTERSS','en',20,true,'International Relations and Security Studies','International Relations and Security Studies','Comité personnalisé d’AlphaMUN consacré aux relations internationales et aux études de sécurité ; son cadre précis reste à compléter par l’organisation.','A custom AlphaMUN committee on international relations and security studies; its detailed framework remains to be supplied by the organisers.'],
 ['UN WOMEN','en',25,false,'ONU Femmes','UN Women','Œuvre pour l’égalité entre les femmes et les hommes, les droits des femmes et leur autonomisation.','Works for gender equality, women’s rights and their empowerment.','S(2)'],
 ['AU PSC','en',20,false,'Conseil de paix et de sécurité de l’Union africaine','African Union Peace and Security Council','Consacré à la prévention et à la résolution des conflits en Afrique.','Dedicated to preventing and resolving conflicts in Africa.'],
 ['ICJ','en',20,false,'Cour internationale de Justice','International Court of Justice','Règle les différends juridiques entre États et rend des avis consultatifs.','Settles legal disputes between States and gives advisory opinions.'],
 ['UNOOSA','en',25,false,'Bureau des affaires spatiales des Nations unies','United Nations Office for Outer Space Affairs','Favorise la coopération et les utilisations pacifiques de l’espace.','Promotes cooperation and the peaceful uses of outer space.'],
 ['UE','fr',25,false,'Union européenne','European Union','Union politique et économique favorisant la coopération entre ses États membres.','A political and economic union promoting cooperation between its Member States.'],
 ['CSNU','fr',20,true,'Conseil de sécurité des Nations unies','United Nations Security Council','Organe chargé du maintien de la paix et de la sécurité internationales.','The body responsible for maintaining international peace and security.'],
 ['CIGIA','fr',25,false,'Conseil international de gouvernance de l’intelligence artificielle','International Council for Artificial Intelligence Governance','Comité personnalisé d’AlphaMUN sur la gouvernance de l’intelligence artificielle ; il ne représente pas un organisme officiel existant.','A custom AlphaMUN committee on artificial intelligence governance; it does not represent an existing official organisation.'],
 ['OMS','fr',25,true,'Organisation mondiale de la Santé','World Health Organization','Coordonne la coopération internationale en santé et la réponse aux urgences sanitaires.','Coordinates international health cooperation and the response to health emergencies.'],
 ['ECOSOC','fr',20,false,'Conseil économique et social des Nations unies','United Nations Economic and Social Council','Coordonne les travaux sur les questions économiques, sociales et le développement durable.','Coordinates work on economic and social issues and sustainable development.'],
 ['UNESCO','fr',20,false,'Organisation des Nations unies pour l’éducation, la science et la culture','United Nations Educational, Scientific and Cultural Organization','Développe la coopération dans ces domaines et protège le patrimoine.','Develops cooperation in these fields and protects heritage.'],
 ['MPS',null,28,false,'Modélisation du Parlement marocain','Model Moroccan Parliament','Simulation pédagogique du Parlement marocain dans le cadre d’AlphaMUN ; langue de débat à compléter.','An educational simulation of the Moroccan Parliament within AlphaMUN; debate language remains to be supplied.','S(2)'],
 ['UNICEF','en',null,false,'Fonds des Nations unies pour l’enfance','United Nations Children’s Fund','Œuvre pour les droits, la protection et le bien-être des enfants dans le monde.','Works for children’s rights, protection and well-being worldwide.'],
 ['UNODC','fr',null,false,'Office des Nations unies contre la drogue et le crime','United Nations Office on Drugs and Crime','Soutient la coopération internationale contre les drogues illicites, la criminalité et le terrorisme.','Supports international cooperation against illicit drugs, crime and terrorism.'],
];

export const committees = rows.map(([acronym,debateLanguage,capacity,crisis,nameFr,nameEn,definitionFr,definitionEn,annotation]) => ({
 id: acronym.toLowerCase().replace(/[^a-z]+/g,'-'), acronym, debateLanguage, capacity, crisis,
 name: {fr:nameFr,en:nameEn}, definition: {fr:definitionFr,en:definitionEn},
 logo: null, annotation: annotation || null, topic: null,
}));
committees.find(committee => committee.acronym === 'UN WOMEN').topic = {
 en: 'Tradition v. equality: breaking the cycle of harmful practices and sexual violence to protect women’s rights across different cultures and legal systems.',
 fr: 'Tradition et égalité : briser le cycle des pratiques néfastes et des violences sexuelles pour protéger les droits des femmes dans différents contextes culturels et systèmes juridiques.',
};

export const committeeVisualNotes = {
 ICJ: 'Use the ICJ visual for the ICJ0 entry in the notes.',
 CSNU: 'Use the CSNU visual.',
 'AU PSC': 'Use the AUPSC visual.',
 CIGIA: 'Custom committee; acronym and name confirmed by the organiser.',
 excluded: ['DISEC', '27 S'],
};

// Verified against the acronym visible in each supplied image.
const committeeLogos = {
 INTERPOL: 'interpol-transparent.png', INTERSS: 'interss-transparent.png', 'UN WOMEN': 'unwomen-transparent.png',
 'AU PSC': 'aupsc-transparent.png', ICJ: 'icj-transparent.png', UNOOSA: 'unoosa-transparent.png', UE: 'ue-transparent.png',
 'CSNU': 'csnu-transparent.png', OMS: 'oms-transparent.png', ECOSOC: 'ecosoc-transparent.png',
 UNESCO: 'unesco-transparent.png', MPS: 'mps-transparent.png', CIGIA: 'cigia-transparent.png', UNICEF: 'unicef-transparent.png', UNODC: 'unodc-transparent.png',
};
for (const committee of committees) {
 const filename = committeeLogos[committee.acronym];
 committee.logo = filename ? `/assets/committees/${filename}` : null;
}

const finalOrder = ['INTERPOL', 'INTERSS', 'UN WOMEN', 'ICJ', 'AU PSC', 'UNOOSA', 'UNICEF', 'UNODC', 'CSNU', 'OMS', 'CIGIA', 'ECOSOC', 'UNESCO', 'UE', 'MPS'];
committees.sort((a, b) => finalOrder.indexOf(a.acronym) - finalOrder.indexOf(b.acronym));