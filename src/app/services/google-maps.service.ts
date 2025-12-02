import { Injectable } from '@angular/core';

declare var google: any;

export interface PlaceDetails {
  name: string;
  formattedAddress: string;
  lat: number;
  lng: number;
  placeId: string;
  types: string[];
  streetNumber?: string;
  route?: string;
  neighborhood?: string;
  locality?: string;
  administrativeArea?: string;
  country?: string;
  postalCode?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GoogleMapsService {
  private autocompleteService: any;
  private placesService: any;
  private isLoaded = false;

  constructor() {}

  async waitForGoogleMapsToLoad(): Promise<void> {
    if (this.isLoaded) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const checkIfLoaded = () => {
        if (typeof google !== 'undefined' && google.maps && google.maps.places) {
          this.isLoaded = true;
          this.autocompleteService = new google.maps.places.AutocompleteService();
          resolve();
        } else {
          setTimeout(checkIfLoaded, 100);
        }
      };
      checkIfLoaded();
    });
  }

  async getCitySuggestions(input: string, countryCode: string = 'CO'): Promise<any[]> {
    await this.waitForGoogleMapsToLoad();
    
    if (!input || input.length < 2) {
      return Promise.resolve([]);
    }

    return new Promise((resolve, reject) => {
      const request = {
        input: input,
        types: ['(cities)'],
        componentRestrictions: { country: countryCode }
      };

      this.autocompleteService.getPlacePredictions(request, (predictions: any, status: any) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          resolve(predictions);
        } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          resolve([]);
        } else {
          reject(status);
        }
      });
    });
  }

  async getMunicipalitySuggestions(input: string, countryCode: string = 'CO', municipio?: string): Promise<any[]> {
    await this.waitForGoogleMapsToLoad();
    
    if (!input || input.length < 2) {
      return Promise.resolve([]);
    }

    return new Promise((resolve, reject) => {
      // Si hay un municipio seleccionado, buscar sectores cerca de ese municipio
      let searchInput = input;
      if (municipio && municipio.trim()) {
        // Buscar sectores dentro del municipio - incluir municipio en la búsqueda
        searchInput = `${input}, ${municipio}, Colombia`;
      }

      const request = {
        input: searchInput,
        types: ['sublocality', 'sublocality_level_1', 'neighborhood', 'administrative_area_level_3'],
        componentRestrictions: { country: countryCode }
      };

      this.autocompleteService.getPlacePredictions(request, (predictions: any, status: any) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          // Filtrar resultados para que contengan el municipio si está especificado
          // Esto asegura que los sectores pertenezcan al municipio seleccionado
          let filtered = predictions;
          if (municipio && municipio.trim()) {
            const municipioLower = municipio.toLowerCase();
            // Filtrar por municipio en la descripción completa
            filtered = predictions.filter((p: any) => {
              const descLower = p.description.toLowerCase();
              // Verificar que el municipio aparezca en la descripción
              // y que no sea solo el nombre del sector sin el municipio
              return descLower.includes(municipioLower);
            });
            
            // Si no hay resultados con el filtro estricto, intentar búsqueda más flexible
            // pero priorizando resultados que contengan el municipio
            if (filtered.length === 0) {
              // Buscar resultados que al menos mencionen el municipio en algún término
              filtered = predictions.filter((p: any) => {
                if (p.terms && p.terms.length > 1) {
                  // Verificar si algún término (excepto el primero que es el sector) contiene el municipio
                  return p.terms.some((term: any, index: number) => 
                    index > 0 && term.value.toLowerCase().includes(municipioLower)
                  );
                }
                return false;
              });
            }
          }
          resolve(filtered);
        } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          resolve([]);
        } else {
          reject(status);
        }
      });
    });
  }

  extractCityName(prediction: any): string {
    // Extraer solo el nombre de la ciudad sin el país
    if (prediction.terms && prediction.terms.length > 0) {
      return prediction.terms[0].value;
    }
    return prediction.description.split(',')[0];
  }

  extractMunicipalityName(prediction: any): string {
    // Extraer solo el nombre del municipio
    if (prediction.terms && prediction.terms.length > 0) {
      return prediction.terms[0].value;
    }
    return prediction.description.split(',')[0];
  }

  async getPlaceCoordinates(placeId: string): Promise<{ lat: number; lng: number } | null> {
    await this.waitForGoogleMapsToLoad();
    
    return new Promise((resolve, reject) => {
      if (!this.placesService) {
        // Crear PlacesService si no existe
        const map = new google.maps.Map(document.createElement('div'));
        this.placesService = new google.maps.places.PlacesService(map);
      }

      const request = {
        placeId: placeId,
        fields: ['geometry']
      };

      this.placesService.getDetails(request, (place: any, status: any) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place && place.geometry) {
          const location = place.geometry.location;
          resolve({
            lat: location.lat(),
            lng: location.lng()
          });
        } else {
          console.error('Error al obtener coordenadas:', status);
          resolve(null);
        }
      });
    });
  }

  /**
   * Busca direcciones exactas, establecimientos y lugares específicos
   * Incluye calles, negocios, puntos de interés, etc.
   */
  async getAddressSuggestions(input: string, countryCode: string = 'CO', nearLocation?: { lat: number, lng: number }): Promise<any[]> {
    await this.waitForGoogleMapsToLoad();
    
    if (!input || input.length < 3) {
      return Promise.resolve([]);
    }

    return new Promise((resolve, reject) => {
      const request: any = {
        input: input,
        componentRestrictions: { country: countryCode },
        // Incluir todos los tipos de lugares para búsqueda completa
        types: ['establishment', 'geocode']
      };

      // Si hay una ubicación cercana, priorizar resultados cerca de esa ubicación
      if (nearLocation) {
        request.location = new google.maps.LatLng(nearLocation.lat, nearLocation.lng);
        request.radius = 50000; // 50km de radio
      }

      this.autocompleteService.getPlacePredictions(request, (predictions: any, status: any) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          resolve(predictions);
        } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          resolve([]);
        } else {
          reject(status);
        }
      });
    });
  }

  /**
   * Obtiene los detalles completos de un lugar incluyendo dirección formateada,
   * componentes de dirección, coordenadas y más
   */
  async getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
    await this.waitForGoogleMapsToLoad();
    
    return new Promise((resolve, reject) => {
      if (!this.placesService) {
        const map = new google.maps.Map(document.createElement('div'));
        this.placesService = new google.maps.places.PlacesService(map);
      }

      const request = {
        placeId: placeId,
        fields: [
          'name',
          'formatted_address',
          'geometry',
          'address_components',
          'types',
          'place_id'
        ]
      };

      this.placesService.getDetails(request, (place: any, status: any) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          const details: PlaceDetails = {
            name: place.name || '',
            formattedAddress: place.formatted_address || '',
            lat: place.geometry?.location?.lat() || 0,
            lng: place.geometry?.location?.lng() || 0,
            placeId: place.place_id || placeId,
            types: place.types || []
          };

          // Extraer componentes de la dirección
          if (place.address_components) {
            for (const component of place.address_components) {
              const types = component.types;
              if (types.includes('street_number')) {
                details.streetNumber = component.long_name;
              } else if (types.includes('route')) {
                details.route = component.long_name;
              } else if (types.includes('neighborhood') || types.includes('sublocality_level_1')) {
                details.neighborhood = component.long_name;
              } else if (types.includes('locality')) {
                details.locality = component.long_name;
              } else if (types.includes('administrative_area_level_1')) {
                details.administrativeArea = component.long_name;
              } else if (types.includes('country')) {
                details.country = component.long_name;
              } else if (types.includes('postal_code')) {
                details.postalCode = component.long_name;
              }
            }
          }

          resolve(details);
        } else {
          console.error('Error al obtener detalles del lugar:', status);
          resolve(null);
        }
      });
    });
  }

  /**
   * Formatea la dirección para mostrar de manera legible
   */
  formatAddressForDisplay(details: PlaceDetails): string {
    const parts: string[] = [];
    
    // Si tiene nombre de establecimiento, incluirlo
    if (details.name && details.name !== details.route) {
      parts.push(details.name);
    }
    
    // Dirección de calle
    if (details.route) {
      let streetAddress = details.route;
      if (details.streetNumber) {
        streetAddress = `${details.route} #${details.streetNumber}`;
      }
      parts.push(streetAddress);
    }
    
    // Barrio/Sector
    if (details.neighborhood) {
      parts.push(details.neighborhood);
    }
    
    // Ciudad
    if (details.locality) {
      parts.push(details.locality);
    }
    
    return parts.join(', ') || details.formattedAddress;
  }
}
