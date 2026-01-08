import { Konfiguracija } from '../zajednicko/konfiguracija.js';

export class TMDBServis {
  private apiKey: string;
  private baseUrl: string = 'https://api.themoviedb.org/3';

  constructor(konf: Konfiguracija) {
    this.apiKey = konf.daj('tmdbApiKeyV3');
  }

  async pretraziSerije(query: string, page: number = 1): Promise<any> {
    const url = `${this.baseUrl}/search/tv?api_key=${this.apiKey}&query=${encodeURIComponent(query)}&page=${page}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('TMDB API greska');
    }
    
    return await response.json();
  }

  prilagodiStranicenje(tmdbOdgovor: any, appStranicenje: number): any {
    const tmdbPoStranici = tmdbOdgovor.results.length;
    const ukupnoRezultata = tmdbOdgovor.total_results;
    
    const noviUkupnoStranica = Math.ceil(ukupnoRezultata / appStranicenje);
    const prikazaniRezultati = tmdbOdgovor.results.slice(0, appStranicenje);

    return {
      results: prikazaniRezultati,
      page: tmdbOdgovor.page,
      total_pages: noviUkupnoStranica,
      total_results: ukupnoRezultata
    };
  }
}