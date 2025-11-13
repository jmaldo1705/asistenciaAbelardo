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

  async getMunicipalitySuggestions(input: string, countryCode: string = 'CO'): Promise<any[]> {
    await this.waitForGoogleMapsToLoad();
    
    if (!input || input.length < 2) {
      return Promise.resolve([]);
    }

    return new Promise((resolve, reject) => {
      const request = {
        input: input,
        types: ['locality', 'sublocality', 'administrative_area_level_3'],
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

