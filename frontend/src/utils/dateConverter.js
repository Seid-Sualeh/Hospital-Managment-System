/**
 * Ethiopian (Ge'ez) <-> Gregorian calendar conversion utilities for client side
 */

function gregorianToJdn(year, month, day) {
  if (month <= 2) {
    year -= 1;
    month += 12;
  }
  const A = Math.floor(year / 100);
  const B = Math.floor(A / 4);
  const C = 2 - A + B;
  const E = Math.floor(365.25 * (year + 4716));
  const F = Math.floor(30.6001 * (month + 1));
  return C + day + E + F - 1524.5;
}

function jdnToGregorian(jdn) {
  const jd = jdn + 0.5;
  const Z = Math.floor(jd);
  const F = jd - Z;
  let A = Z;
  if (Z >= 2299161) {
    const alpha = Math.floor((Z - 1867216.25) / 36524.25);
    A = Z + 1 + alpha - Math.floor(alpha / 4);
  }
  const B = A + 1524;
  const C = Math.floor((B - 122.1) / 365.25);
  const D = Math.floor(365.25 * C);
  const E = Math.floor((B - D) / 30.6001);
  
  const day = B - D - Math.floor(30.6001 * E) + F;
  const month = E < 14 ? E - 1 : E - 13;
  const year = month > 2 ? C - 4716 : C - 4715;
  
  return {
    year: Math.floor(year),
    month: Math.floor(month),
    day: Math.floor(day)
  };
}

function jdnToEthiopian(jdn) {
  const r = (jdn - 1723856) % 1461;
  const n = (r % 365) + 365 * Math.floor(r / 1460);
  const year = 4 * Math.floor((jdn - 1723856) / 1461) + Math.floor(r / 365) - Math.floor(r / 1460);
  const month = Math.floor(n / 30) + 1;
  const day = (n % 30) + 1;
  
  return {
    year: Math.floor(year),
    month: Math.floor(month),
    day: Math.floor(day)
  };
}

function etiopianToJdn(year, month, day) {
  return (1723856 + 365) + 365 * (year - 1) + Math.floor(year / 4) + 30 * (month - 1) + day - 366;
}

export const toEthiopian = (gregDateString) => {
  if (!gregDateString) return '';
  const date = new Date(gregDateString);
  if (isNaN(date.getTime())) return '';
  
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  const jdn = gregorianToJdn(year, month, day);
  const eth = jdnToEthiopian(jdn);
  
  const dd = String(eth.day).padStart(2, '0');
  const mm = String(eth.month).padStart(2, '0');
  const yyyy = String(eth.year);
  
  return `${dd}/${mm}/${yyyy}`;
};

export const toGregorian = (day, month, year) => {
  if (!day || !month || !year) return '';
  const jdn = etiopianToJdn(parseInt(year), parseInt(month), parseInt(day));
  const greg = jdnToGregorian(jdn);
  
  const yyyy = String(greg.year);
  const mm = String(greg.month).padStart(2, '0');
  const dd = String(greg.day).padStart(2, '0');
  
  return `${yyyy}-${mm}-${dd}`;
};

export const ETHIOPIAN_MONTHS = [
  { id: 1, en: 'Meskerem', am: 'መስከረም' },
  { id: 2, en: 'Tekemt', am: 'ጥቅምት' },
  { id: 3, en: 'Hidar', am: 'ኅዳር' },
  { id: 4, en: 'Tahsas', am: 'ታኅሣሥ' },
  { id: 5, en: 'Tir', am: 'ጥር' },
  { id: 6, en: 'Yakatit', am: 'የካቲት' },
  { id: 7, en: 'Megabit', am: 'መጋቢት' },
  { id: 8, en: 'Miyazya', am: 'ሚያዝያ' },
  { id: 9, en: 'Genbot', am: 'ግንቦት' },
  { id: 10, en: 'Sene', am: 'ሰኔ' },
  { id: 11, en: 'Hamle', am: 'ሐምሌ' },
  { id: 12, en: 'Nehase', am: 'ነሐሴ' },
  { id: 13, en: 'Pagumen', am: 'ጳጉሜን' }
];
