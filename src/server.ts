import type { Application, Request, Response, RequestHandler } from 'express';
import type { SessionOptions } from 'express-session';
import * as fs from 'fs';
import * as path from 'path';

const express = require('express');
const session = require('express-session');

interface Konfiguracija {
  tajniKljucSesija: string;
  appStranicenje: number;
  trajanjeSesije: number;
  neuspjesnePrijave: number;
  tmdbApiKeyV3: string;
}

class Server {
  private app: Application;
  private konfiguracija: Konfiguracija | null = null;

  constructor() {
    this.app = express();
  }

  private ucitajKonfiguraciju(putanjaDatoteke: string): boolean {
    try {
      if (!fs.existsSync(putanjaDatoteke)) {
        console.error(`GREŠKA: Konfiguracijska datoteka '${putanjaDatoteke}' ne postoji!`);
        return false;
      }

      const sadrzaj = fs.readFileSync(putanjaDatoteke, 'utf-8');
      const linije = sadrzaj.split('\n').filter(l => l.trim() !== '');
      const config: any = {};

      for (const linija of linije) {
        const [naziv, ...vrijednostArray] = linija.split(':');
        const vrijednost = vrijednostArray.join(':').trim();
        if (naziv && vrijednost) {
          config[naziv.trim()] = vrijednost;
        }
      }

      if (!this.validirajKonfiguraciju(config)) {
        return false;
      }

      this.konfiguracija = {
        tajniKljucSesija: config.tajniKljucSesija,
        appStranicenje: parseInt(config.appStranicenje),
        trajanjeSesije: parseInt(config.trajanjeSesije),
        neuspjesnePrijave: parseInt(config.neuspjesnePrijave),
        tmdbApiKeyV3: config.tmdbApiKeyV3
      };

      console.log('✓ Konfiguracija uspješno učitana');
      return true;
    } catch (error) {
      console.error('GREŠKA pri učitavanju konfiguracije:', error);
      return false;
    }
  }

  private validirajKonfiguraciju(config: any): boolean {
    if (!config.tajniKljucSesija || config.tajniKljucSesija.length < 75 || config.tajniKljucSesija.length > 100) {
      console.error('error: "tajniKljucSesija" mora biti između 75 i 100 znakova!');
      console.error(`Trenutna veličina: ${config.tajniKljucSesija?.length || 0} znakova`);
      return false;
    }

    const appStranicenje = parseInt(config.appStranicenje);
    if (isNaN(appStranicenje) || appStranicenje < 5 || appStranicenje > 20) {
      console.error('error: "appStranicenje" mora biti broj između 5 i 20!');
      return false;
    }

    const trajanjeSesije = parseInt(config.trajanjeSesije);
    if (isNaN(trajanjeSesije) || trajanjeSesije < 5 || trajanjeSesije > 30) {
      console.error('error: "trajanjeSesije" mora biti broj između 5 i 30!');
      return false;
    }

    const neuspjesnePrijave = parseInt(config.neuspjesnePrijave);
    if (isNaN(neuspjesnePrijave) || neuspjesnePrijave < 3 || neuspjesnePrijave > 10) {
      console.error('error: "neuspjesnePrijave" mora biti broj između 3 i 10!');
      return false;
    }

    if (!config.tmdbApiKeyV3 || config.tmdbApiKeyV3.trim() === '') {
      console.error('error: unesi tmdbApiKeyV3');
      return false;
    }

    return true;
  }

  private postaviMiddleware(): void {
    if (!this.konfiguracija) return;

    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    const sessionConfig: SessionOptions = {
      secret: this.konfiguracija.tajniKljucSesija,
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: this.konfiguracija.trajanjeSesije * 60 * 1000 }
    };
    
    this.app.use(session(sessionConfig));
    this.app.use('/dokumentacija', express.static(path.join(__dirname, '../dokumentacija')));
  }

  private postaviRute(): void {
    this.app.get('/', (req: Request, res: Response) => {
      res.json({
        poruka: 'TMDB Movies API Server',
        konfiguracija: {
          stranicenje: this.konfiguracija?.appStranicenje,
          trajanjeSesije: `${this.konfiguracija?.trajanjeSesije} minuta`,
          maxNeuspjesnePrijave: this.konfiguracija?.neuspjesnePrijave
        }
      });
    });

    this.app.get('/api', (req: Request, res: Response) => {
      res.json({
        endpoints: {
          GET: {
            '/': 'Status servera',
            '/api': 'API dokumentacija'
          }
        }
      });
    });
  }

  public pokreni(args: string[]): void {
    if (args.length < 3 || args.length > 4) {
      console.error('GREŠKA: Neispravan broj argumenata!');
      console.log('Uporaba: node server.js konfiguracija.csv [port]');
      process.exit(1);
    }

    const konfiguracijska = args[2];
    const port = args[3] ? parseInt(args[3]) : 3000;


    console.log('Pokretanje...');


    if (!this.ucitajKonfiguraciju(konfiguracijska)) {
      console.error('\n✗ Server se ne moze pokrenuti!');
      process.exit(1);
    }

    this.postaviMiddleware();
    this.postaviRute();

    this.app.listen(port, () => {
      console.log(`Server uspjesno pokrenut na portu ${port}`);
      console.log(`URL: http://localhost:${port}`);

    });
  }
}

const server = new Server();
server.pokreni(process.argv);