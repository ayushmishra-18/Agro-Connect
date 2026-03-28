'use server';

export async function searchLocation(query: string) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&email=contact@agro-connect.com`, {
      headers: {
        'User-Agent': 'AgroConnect/1.0 (contact@agro-connect.com)',
      },
      next: { revalidate: 3600 }
    });
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Server-side Nominatim error:", error);
    return [];
  }
}

export async function reverseGeocode(lat: number, lon: number) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&email=contact@agro-connect.com`, {
      headers: {
        'User-Agent': 'AgroConnect/1.0 (contact@agro-connect.com)',
      },
      next: { revalidate: 3600 }
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Server-side reverse geocoding error:", error);
    return null;
  }
}
