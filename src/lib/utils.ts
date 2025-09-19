import { format, differenceInMinutes, startOfWeek, endOfWeek, parseISO } from 'date-fns';

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

export function isWithinRadius(
  userLat: number,
  userLng: number,
  siteLat: number,
  siteLng: number,
  radius: number
): boolean {
  const distance = calculateDistance(userLat, userLng, siteLat, siteLng);
  return distance <= radius;
}

export function calculateHours(clockIn: string, clockOut: string): number {
  const inTime = parseISO(clockIn);
  const outTime = parseISO(clockOut);
  const minutes = differenceInMinutes(outTime, inTime);
  return Math.round((minutes / 60) * 100) / 100; // Round to 2 decimal places
}

export function formatTime(dateString: string): string {
  if (!dateString || dateString.trim() === '') return '';
  try {
    const date = parseISO(dateString);
    if (isNaN(date.getTime())) return '';
    return format(date, 'h:mm a');
  } catch (error) {
    console.warn('Invalid date string:', dateString);
    return '';
  }
}

export function formatDate(dateString: string): string {
  if (!dateString || dateString.trim() === '') return '';
  try {
    const date = parseISO(dateString);
    if (isNaN(date.getTime())) return '';
    return format(date, 'MM/dd/yyyy');
  } catch (error) {
    console.warn('Invalid date string:', dateString);
    return '';
  }
}

export function formatDateTime(dateString: string): string {
  if (!dateString || dateString.trim() === '') return '';
  try {
    const date = parseISO(dateString);
    if (isNaN(date.getTime())) return '';
    return format(date, 'MM/dd/yyyy h:mm a');
  } catch (error) {
    console.warn('Invalid date string:', dateString);
    return '';
  }
}

export function getCurrentWeekRange() {
  const now = new Date();
  const start = startOfWeek(now, { weekStartsOn: 0 }); // Sunday
  const end = endOfWeek(now, { weekStartsOn: 0 }); // Saturday
  return { start, end };
}

export function isThisWeek(dateString: string): boolean {
  const date = parseISO(dateString);
  const { start, end } = getCurrentWeekRange();
  return date >= start && date <= end;
}

export function formatHoursForDisplay(hours: number): string {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  
  if (minutes === 0) {
    return `${wholeHours} hour${wholeHours !== 1 ? 's' : ''}`;
  }
  
  return `${wholeHours}h ${minutes}m`;
}

export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      (error) => {
        let message = 'Unable to get location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location permission denied. Please enable location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out.';
            break;
        }
        reject(new Error(message));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}