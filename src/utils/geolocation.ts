export interface GeoPosition {
  lat: number;
  lng: number;
  timestamp: number;
  accuracy?: number;
  altitude?: number | null;
  speed?: number | null;
  heading?: number | null;
}

export interface GeoError {
  code: number;
  message: string;
}

// Конфігурація фільтрації GPS
export const GPS_CONFIG = {
  MIN_ACCURACY: 20, // Ігнорувати точки з точністю гірше 20м
  MIN_DISTANCE: 4,  // Записувати нову точку тільки якщо пройшли 4м
  TIMEOUT: 15000,   // Збільшено таймаут для пошуку супутників
};

export class GeolocationService {
  private watchId: number | null = null;
  private isWatching: boolean = false;

  static isAvailable(): boolean {
    return 'geolocation' in navigator;
  }

  async getCurrentPosition(): Promise<GeoPosition> {
    if (!GeolocationService.isAvailable()) {
      throw new Error('Геолокація недоступна в цьому браузері');
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => resolve(this.convertPosition(position)),
        (error) => reject(this.convertError(error)),
        {
          enableHighAccuracy: true,
          timeout: GPS_CONFIG.TIMEOUT,
          maximumAge: 0,
        }
      );
    });
  }

  startWatching(
    onPosition: (position: GeoPosition) => void,
    onError?: (error: GeoError) => void
  ): void {
    if (!GeolocationService.isAvailable()) {
      onError?.({ code: 0, message: 'Геолокація недоступна' });
      return;
    }

    if (this.isWatching) return;

    this.isWatching = true;

    this.watchId = navigator.geolocation.watchPosition(
      (position) => onPosition(this.convertPosition(position)),
      (error) => onError?.(this.convertError(error)),
      {
        enableHighAccuracy: true,
        timeout: GPS_CONFIG.TIMEOUT,
        maximumAge: 0,
      }
    );
  }

  stopWatching(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
      this.isWatching = false;
    }
  }

  private convertPosition(position: GeolocationPosition): GeoPosition {
    return {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      timestamp: position.timestamp,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude,
      speed: position.coords.speed,
      heading: position.coords.heading,
    };
  }

  private convertError(error: GeolocationPositionError): GeoError {
    let message = 'Помилка геолокації';
    switch (error.code) {
      case error.PERMISSION_DENIED:
        message = 'Доступ заборонено. Надайте дозвіл у налаштуваннях.';
        break;
      case error.POSITION_UNAVAILABLE:
        message = 'Пошук супутників... Перевірте, чи ви на відкритому просторі.';
        break;
      case error.TIMEOUT:
        message = 'Слабкий сигнал GPS. Спробуйте ще раз.';
        break;
    }
    return { code: error.code, message };
  }
}

// Формула Haversine для розрахунку відстані (вже була у вас, залишаємо без змін)
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Helper для перевірки, чи варто додавати точку
export function shouldAddPoint(
  newPoint: GeoPosition,
  lastPoint: GeoPosition | null
): boolean {
  // 1. Фільтр точності (Accuracy Filter)
  if (newPoint.accuracy && newPoint.accuracy > GPS_CONFIG.MIN_ACCURACY) {
    console.log(`GPS пропущено: низька точність (${newPoint.accuracy}м)`);
    return false;
  }

  // 2. Якщо це перша точка - додаємо
  if (!lastPoint) return true;

  // 3. Фільтр відстані (Distance Filter)
  const dist = calculateDistance(lastPoint.lat, lastPoint.lng, newPoint.lat, newPoint.lng);
  
  if (dist < GPS_CONFIG.MIN_DISTANCE) {
    return false; // Рух занадто малий (дрейф GPS)
  }

  return true;
}

export const geoService = new GeolocationService();