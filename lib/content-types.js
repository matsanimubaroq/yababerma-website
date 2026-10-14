// Dependency-free content constants shared by the API (lib/cms.js) and the browser (admin + public pages).

export const PARTNER_TYPES = [
  ['media', 'Media Partner'],
  ['kebaikan', 'Partner Kebaikan'],
  ['community', 'Community Partner'],
];
export const PARTNER_TYPE_LABEL = Object.fromEntries(PARTNER_TYPES);

/** "Matsani Mubaroq" + "S.Sos." -> "Matsani Mubaroq, S.Sos." */
export const authorDisplayName = (a) => (a?.degree ? `${a.name}, ${a.degree}` : a?.name || '');
