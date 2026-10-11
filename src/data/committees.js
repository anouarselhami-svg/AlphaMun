// Debate language is independent from the site's display language.
// Supply logo URLs only after checking the acronym in the actual image.
const rows = [
 ['INTERPOL','en',20,true,'Organisation internationale de police criminelle','International Criminal Police Organization','Facilite la coopération entre les polices pour lutter contre la criminalité internationale.','Facilitates cooperation between police forces to combat international crime.','S(1)'],
 ['INTERSS','en',20,true,null,null,'Nom complet et mandat à confirmer auprès de l’organisation.','Full name and mandate to be confirmed with the organisers.'],
 ['UN WOMEN','en',25,false,'ONU Femmes','UN Women','Œuvre pour l’égalité entre les femmes et les hommes, les droits des femmes et leur autonomisation.','Works for gender equality, women’s rights and their empowerment.','S(2)'],
 ['AU PSC','en',20,false,'Conseil de paix et de sécurité de l’Union africaine','African Union Peace and Security Council','Consacré à la prévention et à la résolution des conflits en Afrique.','Dedicated to preventing and resolving conflicts in Africa.'],
 ['ICJ','en',20,false,'Cour internationale de Justice','International Court of Justice','Règle les différends juridiques entre États et rend des avis consultatifs.','Settles legal disputes between States and gives advisory opinions.'],
 ['UNOOSA','en',25,false,'Bureau des affaires spatiales des Nations unies','United Nations Office for Outer Space Affairs','Favorise la coopération et les utilisations pacifiques de l’espace.','Promotes cooperation and the peaceful uses of outer space.'],
 ['UE','fr',25,false,'Union européenne','European Union','Union politique et économique favorisant la coopération entre ses États membres.','A political and economic union promoting cooperation between its Member States.'],
 ['UNSC / CSNU','fr',20,true,'Conseil de sécurité des Nations unies','United Nations Security Council','Organe chargé du maintien de la paix et de la sécurité internationales.','The body responsible for maintaining international peace and security.'],
 ['IAIGC','fr',25,false,null,null,'Nom complet et correspondance avec le visuel « CIGIA » à confirmer.','Full name and correspondence with the “CIGIA” visual to be confirmed.'],
 ['OMS','fr',25,true,'Organisation mondiale de la Santé','World Health Organization','Coordonne la coopération internationale en santé et la réponse aux urgences sanitaires.','Coordinates international health cooperation and the response to health emergencies.'],
 ['ECOSOC','fr',20,false,'Conseil économique et social des Nations unies','United Nations Economic and Social Council','Coordonne les travaux sur les questions économiques, sociales et le développement durable.','Coordinates work on economic and social issues and sustainable development.'],
 ['UNESCO','fr',20,false,'Organisation des Nations unies pour l’éducation, la science et la culture','United Nations Educational, Scientific and Cultural Organization','Développe la coopération dans ces domaines et protège le patrimoine.','Develops cooperation in these fields and protects heritage.'],
 ['DISEC','fr',20,false,'Commission du désarmement et de la sécurité internationale','Disarmament and International Security Committee','Première commission de l’Assemblée générale des Nations unies.','The First Committee of the United Nations General Assembly.'],
 ['MPS',null,28,false,null,null,'Nom complet, mandat et langue de débat à confirmer.','Full name, mandate and debate language to be confirmed.','S(2)'],
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
 'ICJ': 'Use the ICJ visual for the ICJ0 entry in the notes.',
 'UNSC / CSNU': 'Use the CSNU visual.',
 'AU PSC': 'Use the AUPSC visual.',
 'IAIGC': 'Do not associate CIGIA until its correspondence with IAIGC is confirmed.',
 'DISEC': 'No identified visual: use the acronym.',
 excluded: ['UNICEF', 'UNODC', '27 S'],
};

// Verified against the acronym visible in each supplied image.
const committeeLogos = {
 INTERPOL: 'interpol.jpg', INTERSS: 'interss.jpg', 'UN WOMEN': 'unwomen.jpg',
 'AU PSC': 'aupsc.jpg', ICJ: 'icj.jpg', UNOOSA: 'unoosa.jpg', UE: 'ue.jpg',
 'UNSC / CSNU': 'csnu.jpg', OMS: 'oms.jpg', ECOSOC: 'ecosoc.jpg',
 UNESCO: 'unesco.jpg', MPS: 'mps.jpg',
};
for (const committee of committees) {
 const filename = committeeLogos[committee.acronym];
 committee.logo = filename ? `/assets/committees/${filename}` : null;
}