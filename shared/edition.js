// Source: Projet ALPHAMUN 8e, pages 4–7 and 20. Canonical edition data.
export const edition = {name:'AlphaMUN', number:8, targetParticipants:270, start:'2027-01-22T14:00:00+01:00', end:'2027-01-24T21:00:00+01:00', timeZone:'Africa/Casablanca', organisation:'Groupe Pédagogique Alpha', city:'Kénitra'};
export const debateLanguages = {en:{fr:'Anglais',en:'English'},fr:{fr:'Français',en:'French'},ar:{fr:'Arabe',en:'Arabic'}};
export const committeeCatalogue = [
 {name:'UN WOMEN',language:'en'}, {name:'INTERPOL',language:'en'}, {name:'INTERSS',language:'en'}, {name:'MOOT COURT',language:'en'}, {name:'AU PSC',language:'en'}, {name:'UNOOSA',language:'en'},
 {name:'CSNU',language:'fr'}, {name:'OMS',language:'fr'}, {name:'CIGIA',language:'fr'}, {name:'UE',language:'fr'}, {name:'UNICEF',language:'fr'}, {name:'ONUDC',language:'fr'}, {name:'MPS',language:'ar'},
].map(committee=>({...committee,id:committee.name.toLowerCase().replace(/[^a-z]+/g,'-')}));
export const packages = {
 '500':{amount:500,fr:'Pack Normal',en:'Normal Package'},
 '1500':{amount:1500,fr:'Pack Gold / Externe',en:'Gold / External Package'},
};
export const venues = [
 {day:1,date:'Vendredi 22 janvier 2027',name:'Université Ibn Tofail',short:'UIT',city:'Kénitra'},
 {day:2,date:'Samedi 23 janvier 2027',name:'Université Internationale de Rabat',short:'UIR',city:'Rabat'},
 {day:3,date:'Dimanche 24 janvier 2027',name:'Palais Lalla Laaroussa',short:'',city:'Kénitra'},
];
export const sponsors = ['The British Town','Algorithmics','Gastromixte','Akavision','Norjiba','AMPOC','Inwi','Banque Populaire','Sidi Ali'];
export const partners = ['Morocco World News','MAP','Medi1TV','L’Économiste','Ambassade du Royaume-Uni','PJM','Le 360','Ministère de la Jeunesse, de la Culture et de la Communication','KL-YES Program','Ambassade des États-Unis'];
export const proposedSpeakers = ['Panel de quatre étudiants','Représentant de l’Ambassade du Royaume-Uni','Représentant de l’Ambassade des États-Unis','TheGoodDoctor / Ibrahim Boukil','Mohammed Rherras','Hassan Abdelkhalek'];
export const provisionalBudget = {necessary:160300, contributions:147600, additional:12700};
export const packageFeatures = [
 {fr:'Accès aux comités',en:'Committee access'}, {fr:'Kit du délégué',en:'Delegate kit'}, {fr:'Pauses-café',en:'Coffee breaks'},
 {fr:'Transport',en:'Transport'}, {fr:'Déjeuners',en:'Lunches'}, {fr:'Cérémonies',en:'Ceremonies'},
];
export function packageLabel(value,language='fr') {const pack=packages[value];if(!pack)return '';const amount=pack.amount.toLocaleString(language==='fr'?'fr-FR':'en-GB').replace(/\u202f/g,' ');return `${pack[language]} — ${amount} DH`;}
