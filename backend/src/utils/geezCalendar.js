/**
 * Ethiopian (Ge'ez) <-> Gregorian calendar conversion utilities.
 * Uses the Julian Day Number (JDN) math to handle leap years, month offsets, 
 * and Pagumen (the 13th month of 5 or 6 days).
 */

// Corrected Ethiopian Epoch JDN is 1724220 (representing Aug 29, 8 AD Julian)
const EPOCH = 1724220;

// Gregorian calendar JDN calculation
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
  return Math.floor(C + day + E + F - 1524.5 + 0.5);
}

// JDN to Gregorian calendar
function jdnToGregorian(jdn) {
  const Z = Math.floor(jdn + 0.5);
  let A = Z;
  if (Z >= 2299161) {
    const alpha = Math.floor((Z - 1867216.25) / 36524.25);
    A = Z + 1 + alpha - Math.floor(alpha / 4);
  }
  const B = A + 1524;
  const C = Math.floor((B - 122.1) / 365.25);
  const D = Math.floor(365.25 * C);
  const E = Math.floor((B - D) / 30.6001);
  
  const day = B - D - Math.floor(30.6001 * E);
  const month = E < 14 ? E - 1 : E - 13;
  const year = month > 2 ? C - 4716 : C - 4715;
  
  return {
    year: Math.floor(year),
    month: Math.floor(month),
    day: Math.floor(day)
  };
}

// JDN to Ethiopian calendar
function jdnToEthiopian(jdn) {
  const r = (jdn - EPOCH) % 1461;
  const n = (r % 365) + 365 * Math.floor(r / 1460);
  const year = 4 * Math.floor((jdn - EPOCH) / 1461) + Math.floor(r / 365) - Math.floor(r / 1460) + 1;
  const month = Math.floor(n / 30) + 1;
  const day = (n % 30) + 1;
  
  return {
    year: Math.floor(year),
    month: Math.floor(month),
    day: Math.floor(day)
  };
}

// Ethiopian calendar to JDN
function etiopianToJdn(year, month, day) {
  const yearsElapsed = year - 1;
  const cycles = Math.floor(yearsElapsed / 4);
  const remainingYears = yearsElapsed % 4;
  let days = cycles * 1461;
  
  if (remainingYears === 1) {
    days += 365;
  } else if (remainingYears === 2) {
    days += 730;
  } else if (remainingYears === 3) {
    days += 1096;
  }
  
  days += 30 * (month - 1) + (day - 1);
  return EPOCH + days;
}

/**
 * Converts a Gregorian Date (YYYY-MM-DD) to Ethiopian Date String (DD/MM/YYYY)
 * @param {string|Date} gregDateString - e.g., '2026-06-03'
 * @returns {string} - e.g., '27/09/2018' (27th of Sene, 2018)
 */
function toEthiopian(gregDateString) {
  if (!gregDateString) return null;
  let year, month, day;
  if (gregDateString instanceof Date) {
    year = gregDateString.getFullYear();
    month = gregDateString.getMonth() + 1;
    day = gregDateString.getDate();
  } else if (typeof gregDateString === 'string') {
    // Matches YYYY-MM-DD or YYYY/MM/DD
    const parts = gregDateString.substring(0, 10).split(/[-/]/);
    if (parts.length < 3) return null;
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
    day = parseInt(parts[2], 10);
  } else {
    return null;
  }
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  
  const jdn = gregorianToJdn(year, month, day);
  const eth = jdnToEthiopian(jdn);
  
  // Format with leading zeroes
  const dd = String(eth.day).padStart(2, '0');
  const mm = String(eth.month).padStart(2, '0');
  const yyyy = String(eth.year);
  
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * Converts an Ethiopian Date (day, month, year) back to Gregorian Date String (YYYY-MM-DD)
 * @param {number} day - e.g., 27
 * @param {number} month - e.g., 9
 * @param {number} year - e.g., 2018
 * @returns {string} - '2026-06-03'
 */
function toGregorian(day, month, year) {
  if (!day || !month || !year) return null;
  const jdn = etiopianToJdn(parseInt(year), parseInt(month), parseInt(day));
  const greg = jdnToGregorian(jdn);
  
  const yyyy = String(greg.year);
  const mm = String(greg.month).padStart(2, '0');
  const dd = String(greg.day).padStart(2, '0');
  
  return `${yyyy}-${mm}-${dd}`;
}

// English/Amharic month mapping helper
const ETHIOPIAN_MONTH_NAMES = {
  1: { en: 'Meskerem', am: 'መስከረም' },
  2: { en: 'Tekemt', am: 'ጥቅምት' },
  3: { en: 'Hidar', am: 'ኅዳር' },
  4: { en: 'Tahsas', am: 'ታኅሣሥ' },
  5: { en: 'Tir', am: 'ጥር' },
  6: { en: 'Yakatit', am: 'የካቲት' },
  7: { en: 'Megabit', am: 'መጋቢት' },
  8: { en: 'Miyazya', am: 'ሚያዝያ' },
  9: { en: 'Genbot', am: 'ግንቦት' },
  10: { en: 'Sene', am: 'ሰኔ' },
  11: { en: 'Hamle', am: 'ሐምሌ' },
  12: { en: 'Nehase', am: 'ነሐሴ' },
  13: { en: 'Pagumen', am: 'ጳጉሜን' }
};

module.exports = {
  toEthiopian,
  toGregorian,
  ETHIOPIAN_MONTH_NAMES
};
