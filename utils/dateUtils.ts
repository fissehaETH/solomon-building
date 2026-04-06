
/**
 * Utility for Ethiopian Calendar conversions
 * Uses the robust Beyene-Kudlek algorithm for accurate date mapping between 
 * Gregorian and Ethiopian calendars.
 */

const ETHIOPIAN_MONTHS = [
  'መስከረም', 'ጥቅምት', 'ህዳር', 'ታህሳስ', 'ጥር', 'የካቲት',
  'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰኔ', 'ሐምሌ', 'ነሐሴ', 'ጳጉሜ'
];

const WEEKDAYS = ['እሁድ', 'ሰኞ', 'ማክሰኞ', 'ረቡዕ', 'ሐሙስ', 'ዓርብ', 'ቅዳሜ'];

/**
 * Converts a Gregorian Date to an Ethiopian Date object.
 * Based on the JDN epoch 1723856 (Ethiopic 0001-01-01).
 */
export function toEthiopianDate(gregorianDate: Date | string): { day: number, month: number, year: number, monthName: string } {
  const date = typeof gregorianDate === 'string' ? new Date(gregorianDate) : gregorianDate;
  
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  // 1. Calculate Julian Day Number (JDN) for the Gregorian date
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  const jdn = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  
  // 2. Ethiopian Calendar conversion from JDN
  const era = 1723856; // Ethiopic epoch
  const j = jdn - era;
  const ethYear = Math.floor((4 * j + 3) / 1461);
  const r = j - Math.floor(1461 * ethYear / 4);
  const ethMonth = Math.floor((r + 30) / 30);
  const ethDay = r - 30 * (ethMonth - 1) + 1;
  
  // Final boundary check for the 13th month "Pagume"
  let finalMonth = ethMonth;
  let finalDay = ethDay;
  
  if (ethMonth > 13) {
    finalMonth = 13;
    finalDay = r - 360 + 1;
  }

  return {
    day: finalDay,
    month: finalMonth,
    year: ethYear,
    monthName: ETHIOPIAN_MONTHS[finalMonth - 1]
  };
}

/**
 * Formats an ISO date string into a readable Amharic/Ethiopian date string.
 */
export function formatEthiopian(isoString: string, includeTime: boolean = false): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';
  
  const eth = toEthiopianDate(date);
  let formatted = `${eth.monthName} ${eth.day}፣ ${eth.year}`;
  
  if (includeTime) {
    const time = date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    formatted += ` (${time})`;
  }
  
  return formatted;
}

/**
 * Returns the Amharic name of the weekday for a given date string.
 */
export function getEthiopianWeekday(isoString: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';
  return WEEKDAYS[date.getDay()];
}

// @ts-ignore
import { toGregorian as ethToGregorian } from 'ethiopian-date';

/**
 * Converts an Ethiopian Date to a Gregorian Date object.
 */
export function toGregorianDate(year: number, month: number, day: number): Date {
  const [gYear, gMonth, gDay] = ethToGregorian([year, month, day]);
  return new Date(gYear, gMonth - 1, gDay);
}

export const AMHARIC_MONTHS = ETHIOPIAN_MONTHS;
