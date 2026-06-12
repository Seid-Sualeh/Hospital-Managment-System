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
  
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// Corrected Ethiopian Epoch JDN is 1724220 (representing Aug 29, 8 AD Julian)
const EPOCH = 1724220;

function jdnToEthiopian(jdn) {
  const r = (jdn - EPOCH) % 1461;
  const n = (r % 365) + 365 * Math.floor(r / 1460);
  const year = 4 * Math.floor((jdn - EPOCH) / 1461) + Math.floor(r / 365) - Math.floor(r / 1460) + 1;
  const month = Math.floor(n / 30) + 1;
  const day = (n % 30) + 1;
  return { year, month, day };
}

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

const jdn = gregorianToJdn(2026, 6, 3);
const eth = jdnToEthiopian(jdn);
console.log("June 3, 2026 GC to Ethiopian E.C. Date:", eth);

const backJdn = etiopianToJdn(eth.year, eth.month, eth.day);
console.log("Back to Gregorian:", jdnToGregorian(backJdn));

// Check what date converts to 27/09/2018 or Sene 27, 2018 (Sene is Month 10)
console.log("27/09/2018 (Genbot 27) GC Date:", jdnToGregorian(etiopianToJdn(2018, 9, 27)));
console.log("27/10/2018 (Sene 27) GC Date:", jdnToGregorian(etiopianToJdn(2018, 10, 27)));
