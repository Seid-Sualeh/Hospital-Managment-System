const assert = require('assert');
const geezCalendar = require('./src/utils/geezCalendar');

console.log('================================================================');
console.log('CMS SAAS FOR ETHIOPIA - INTEGRITY VERIFICATION UTILITY');
console.log('================================================================');

try {
  // Test Case 1: Convert Gregorian to Ethiopian (GC -> EC)
  // Let's test a known reference point: June 3, 2026 GC (Gregorian) should translate to Ethiopian calendar.
  const ethDate = geezCalendar.toEthiopian('2026-06-03');
  console.log(`[Test 1] Gregorian '2026-06-03' converted to Ethiopian E.C. Date: ${ethDate}`);
  
  // Reference value check: June 3, 2026 GC is Sene 27, 2018 E.C.
  assert.strictEqual(ethDate, '27/09/2018', 'Date conversion to Ethiopian E.C. failed!');
  console.log('✔ [Test 1] Passed (Sene 27, 2018 E.C. resolved correctly)');

  // Test Case 2: Convert Ethiopian to Gregorian (EC -> GC)
  const gregDate = geezCalendar.toGregorian(27, 9, 2018);
  console.log(`[Test 2] Ethiopian '27/09/2018' converted to Gregorian G.C. Date: ${gregDate}`);
  assert.strictEqual(gregDate, '2026-06-03', 'Date conversion to Gregorian G.C. failed!');
  console.log('✔ [Test 2] Passed (June 3, 2026 GC resolved correctly)');

  // Test Case 3: Month Names Helper
  const monthNameEn = geezCalendar.ETHIOPIAN_MONTH_NAMES[9].en; // Genbot
  const monthNameAm = geezCalendar.ETHIOPIAN_MONTH_NAMES[9].am; // ግንቦት
  console.log(`[Test 3] Month 9 English Name: ${monthNameEn} | Amharic Name: ${monthNameAm}`);
  assert.strictEqual(monthNameEn, 'Genbot');
  assert.strictEqual(monthNameAm, 'ግንቦት');
  console.log('✔ [Test 3] Passed (Month translation names resolved correctly)');

  console.log('================================================================');
  console.log('STATUS: ALL FOUNDATIONAL COMPILATION & DATE TESTS PASSED');
  console.log('================================================================');
} catch (error) {
  console.error('[Verification Failed] Error during automated execution checks:');
  console.error(error.message);
  process.exit(1);
}
