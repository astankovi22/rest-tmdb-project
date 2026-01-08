import type { Application } from 'express';
import { Konfiguracija } from './zajednicko/konfiguracija.js';
import { Baza } from './zajednicko/baza.js';
import { dajPort } from './zajednicko/esmPomocnik.js';
import { pripremiPutanjeServis } from './servis/servis.js';
import { pripremiPutanjeAutentifikacija } from './servis/autentifikacija.js';
import { pripremiPutanjeAplikacija } from './aplikacija/aplikacija.js';

const express = require('express');
const cors = require('cors');
const session = require('express-session');

const server: Application = express();

function inicijalizirajKonfiguraciju(datoteka: string): Konfiguracija {
  let konf = new Konfiguracija();
  konf.ucitajKonfiguraciju(datoteka);
  return konf;
}

function pripremiPutanjeServera(server: Application, konf: Konfiguracija, baza: Baza): void {
  server.use(cors());
  server.use(express.json());
  server.use(express.urlencoded({ extended: true }));

  const tajniKljuc = konf.daj('tajniKljucSesija');
  const trajanje = parseInt(konf.daj('trajanjeSesije'));

  server.use(session({
    secret: tajniKljuc,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: trajanje * 60 * 1000 }
  }));

  pripremiPutanjeAplikacija(server);
  pripremiPutanjeAutentifikacija(server, baza, konf);
  pripremiPutanjeServis(server, konf);

  server.use((zahtjev, odgovor) => {
    odgovor.status(404);
    odgovor.json({ greska: 'Nepostojeći resurs' });
  });
}

function pokreniServer(server: Application, port: number): void {
  server.listen(port, () => {
    console.log('Server pokrenut na portu: ' + port);
  });
}

function main(argv: Array<string>): void {
  let konf: Konfiguracija | null = null;

  try {
    const datoteka = argv[2] || 'podaci/konfiguracija.csv';
    konf = inicijalizirajKonfiguraciju(datoteka);
  } catch (greska: Error | any) {
    if (process.argv.length == 2) {
      console.error('Potrebno je dati naziv datoteke');
    } else if (greska.path != undefined) {
      console.error('Nije moguće otvoriti datoteku: ' + greska.path);
    } else {
      console.log(greska.message);
    }
    process.exit(1);
  }

  const bazaPutanja = konf.daj('bazaPodataka');
  const baza = new Baza(bazaPutanja);

  let port: number = dajPort('tvoj_ldap');
  if (argv[3] != undefined) {
    port = parseInt(argv[3]);
  }

  pripremiPutanjeServera(server, konf, baza);
  pokreniServer(server, port);
}

main(process.argv);