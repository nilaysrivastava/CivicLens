export interface LocationResult {
  lat: number;
  lng: number;
  accuracy?: number;
}

export async function getCurrentPosition(
  options = { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
): Promise<LocationResult> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Location access is not available in this browser. You can enter the address manually."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        let message = "We could not detect your location quickly. Please try again or enter the address manually.";
        if (error.code === error.PERMISSION_DENIED) {
          message = "Location permission was denied. Please allow location access or enter the address manually.";
        }
        // AI Studio preview/iframe can sometimes throw specific errors, but they'll fall under general errors usually.
        // We'll return a clean message.
        reject(new Error(message));
      },
      options
    );
  });
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || (typeof process !== 'undefined' ? (process as any).env.GOOGLE_MAPS_API_KEY : undefined);
    if (googleMapsApiKey) {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleMapsApiKey}`
      );
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        return data.results[0].formatted_address;
      }
    }

    // Fallback to OSM Nominatim
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'en-US,en',
        }
      }
    );
    if (!response.ok) {
      throw new Error("Geocoding failed");
    }
    const data = await response.json();
    if (data && data.display_name) {
      return data.display_name;
    }
  } catch (error) {
    console.error("Reverse geocoding error:", error);
  }
  return "";
}

export async function geocodeAddress(address: string): Promise<LocationResult | null> {
  if (!address.trim()) return null;
  
  try {
    const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || (typeof process !== 'undefined' ? (process as any).env.GOOGLE_MAPS_API_KEY : undefined);
    if (googleMapsApiKey) {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${googleMapsApiKey}`
      );
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        return { lat: location.lat, lng: location.lng };
      }
    }

    // Fallback to OSM Nominatim
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      {
        headers: {
          'Accept-Language': 'en-US,en',
        }
      }
    );
    if (!response.ok) {
      throw new Error("Geocoding failed");
    }
    const data = await response.json();
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch (error) {
    console.error("Geocoding error:", error);
  }
  return null;
}
