import { privateEncrypt } from 'crypto';
import fs from 'fs';

export class Konfiguracija {
  private konf: any = {};

  public ucitajKonfiguraciju(datoteka: string = 'podaci/konfiguracija.csv'): void {
    if (!fs.existsSync(datoteka)) {
      throw new Error('Konfiguracijska datoteka ne postoji: ' + datoteka);
    }

    const sadrzaj = fs.readFileSync(datoteka, 'utf-8');
    const linije = sadrzaj.split('\n').filter(l => l.trim() !== '');

    for (const linija of linije) {
      const dijelovi = linija.split(':');
      const naziv = dijelovi[0].trim();
      const vrijednost = dijelovi.slice(1).join(':').trim();
      this.konf[naziv] = vrijednost;
    }

    this.validiraj();
  }

  private validiraj(): void {
    const tajniKljuc = this.konf.tajniKljucSesija;
    if (!tajniKljuc || tajniKljuc.length < 75 || tajniKljuc.length > 100) {
      throw new Error('tajniKljucSesija mora biti između 75 i 100 znakova');
    }

    const stranicenje = parseInt(this.konf.appStranicenje);
    if (isNaN(stranicenje) || stranicenje < 5 || stranicenje > 20) {
      throw new Error('appStranicenje mora biti broj između 5 i 20');
    }

    const trajanje = parseInt(this.konf.trajanjeSesije);
    if (isNaN(trajanje) || trajanje < 5 || trajanje > 30) {
      throw new Error('trajanjeSesije mora biti broj između 5 i 30');
    }

    const neuspjesne = parseInt(this.konf.neuspjesnePrijave);
    if (isNaN(neuspjesne) || neuspjesne < 3 || neuspjesne > 10){
      throw new Error('neuspjesnePrijave mora biti broj između 3 i 10');
    } 

    if (!this.konf.tmdbApiKeyV3) {
      throw new Error('tmdbApiKeyV3 je obavezan');
    }

    if (!this.konf.bazaPodataka) {
      this.konf.bazaPodataka = 'podaci/baza.sqlite';
    }
  }

  public daj(naziv: string): any {
    return this.konf[naziv];
  }
}