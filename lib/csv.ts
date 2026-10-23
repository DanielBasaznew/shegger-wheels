/**
 * Shegger Wheels — CSV Export Utilities
 * 
 * Generates properly escaped CSV files for renter and owner booking records.
 * Follows RFC 4180 standards:
 * - Cells with commas, quotes, or newlines are quoted.
 * - Internal double quotes are escaped as `""`.
 * - Strictly isolates records to the authenticated user.
 */

import { Booking, Car, User } from './types';
import { formatDateString } from './bookings';

/**
 * Escapes a single CSV value following RFC 4180 rules.
 */
export function escapeCSVValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  let str = String(value);

  // Formula injection defense (CWE-1236): Prepend single quote if string starts with formula trigger
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generates CSV string content for a renter's personal booking history.
 * Explicitly guards against data leakage by filtering to the renter's user ID.
 */
export function generateRenterBookingsCSV(
  bookings: Booking[],
  cars: Car[],
  renter: User
): string {
  // Security barrier: export strictly the current renter's records
  const userBookings = bookings.filter((b) => b.renterId === renter.id);

  const headers = [
    'Booking Reference',
    'Vehicle',
    'Make',
    'Model',
    'Year',
    'Neighbourhood',
    'Pick-Up Date',
    'Return Date',
    'Rental Days',
    'Booking Status',
    'Payment Status',
    'Payment Method',
    'Payment Reference',
    'Daily Rate (ETB)',
    'Subtotal (ETB)',
    'Platform Fee (ETB)',
    'Total Amount (ETB)',
    'Created At',
  ];

  const rows = userBookings.map((b) => {
    const car = cars.find((c) => c.id === b.carId);
    return [
      b.id,
      car ? `${car.year} ${car.make} ${car.model}` : 'Vehicle Listing',
      car?.make || '',
      car?.model || '',
      car?.year || '',
      car?.neighbourhood || '',
      b.startDate,
      b.endDate,
      b.days,
      b.status,
      b.paymentStatus,
      b.paymentMethod || 'TeleBirr',
      b.paymentReference || '',
      b.pricePerDay,
      b.subtotal,
      b.fee,
      b.total,
      b.createdAt,
    ]
      .map(escapeCSVValue)
      .join(',');
  });

  return [headers.map(escapeCSVValue).join(','), ...rows].join('\r\n');
}

/**
 * Triggers a browser download of the renter's CSV booking records.
 */
export function downloadRenterBookingsCSV(
  bookings: Booking[],
  cars: Car[],
  renter: User
): void {
  if (typeof window === 'undefined') return;

  const csv = generateRenterBookingsCSV(bookings, cars, renter);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const dateStr = formatDateString(new Date());
  const sanitizedName = renter.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const filename = `shegger-wheels-trips-${sanitizedName}-${dateStr}.csv`;

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
