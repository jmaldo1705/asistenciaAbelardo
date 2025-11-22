import { Injectable } from '@angular/core';

declare var google: any;

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
}

