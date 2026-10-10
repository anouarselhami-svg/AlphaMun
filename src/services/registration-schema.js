export const registrationCommittees = [
  ...['INTERPOL','INTERSS','UN Women','AU PSC','ICJ','UNOOSA'].map(name=>({name,language:'en'})),
  ...['UE','CSNU','OMS','ECOSOC','IAIGC','UNESCO','DISEC'].map(name=>({name,language:'fr'})),
  {name:'MPS',language:'ary'},
];
export const registrationFields = ['prenom','nom','age','email','telephone','contact_parent','ville','etablissement','niveau','comite_choix_1','comite_choix_2','comite_choix_3','participations_mun','experience_details','motivation','attentes','pack','logistique','confirmation_pack','consentement','code_conduite','exactitude'];
