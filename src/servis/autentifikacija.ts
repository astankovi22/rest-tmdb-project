import type { Application, Request, Response } from 'express';
import { Baza } from '../zajednicko/baza.js';
import { Konfiguracija } from '../zajednicko/konfiguracija.js';

const express = require('express');

export function pripremiPutanjeAutentifikacija(server: Application, baza: Baza, konf: Konfiguracija): void {
  
  server.get('/rest/korisnici', (zahtjev: Request, odgovor: Response) => {
    baza.dohvatiSveKorisnike((greska, korisnici) => {
      if (greska) {
        odgovor.status(500).json({ greska: greska.message });
        return;
      }
      odgovor.status(200).json(korisnici);
    });
  });

  server.get('/rest/korisnici/:korime', (zahtjev: Request, odgovor: Response) => {
    const korime = zahtjev.params.korime;
    
    baza.dohvatiKorisnika(korime, (greska, korisnik) => {
      if (greska) {
        odgovor.status(500).json({ greska: greska.message });
        return;
      }
      if (!korisnik) {
        odgovor.status(404).json({ greska: 'Korisnik ne postoji' });
        return;
      }
      odgovor.status(200).json(korisnik);
    });
  });

  server.post('/rest/korisnici', (zahtjev: Request, odgovor: Response) => {
    const { korisnicko_ime, email, lozinka, ime, prezime, datum_rodenja } = zahtjev.body;

    if (!korisnicko_ime || !email || !lozinka || !ime || !prezime || !datum_rodenja) {
      odgovor.status(400).json({ greska: 'Sva polja su obavezna' });
      return;
    }

    baza.registrirajKorisnika(
      korisnicko_ime,
      email,
      lozinka,
      ime,
      prezime,
      datum_rodenja,
      (greska, id) => {
        if (greska) {
          odgovor.status(400).json({ greska: greska.message });
          return;
        }
        odgovor.status(201).json({ poruka: 'Uspjesna registracija', id: id });
      }
    );
  });

  server.put('/rest/korisnici/:korime', (zahtjev: Request, odgovor: Response) => {
    const sesija = zahtjev.session as any;
    const korime = zahtjev.params.korime;

    if (!sesija.korisnik) {
      odgovor.status(401).json({ greska: 'Niste prijavljeni' });
      return;
    }

    if (sesija.korisnik.korisnicko_ime !== korime && sesija.korisnik.uloga !== 'administrator') {
      odgovor.status(403).json({ greska: 'Nemate dopustenje' });
      return;
    }

    const { email, ime, prezime, datum_rodenja } = zahtjev.body;

    baza.azurirajKorisnika(korime, email, ime, prezime, datum_rodenja, (greska) => {
      if (greska) {
        odgovor.status(400).json({ greska: greska.message });
        return;
      }
      odgovor.status(201).json({ poruka: 'Korisnik azuriran' });
    });
  });

  server.post('/rest/korisnici/:korime/prijava', (zahtjev: Request, odgovor: Response) => {
    const korime = zahtjev.params.korime;
    const { lozinka } = zahtjev.body;

    if (!lozinka) {
      odgovor.status(400).json({ greska: 'Lozinka je obavezna' });
      return;
    }

    const maxNeuspjesne = parseInt(konf.daj('neuspjesnePrijave'));

    baza.provjeriAktivnost(korime, (greska, aktivan) => {
      if (greska || !aktivan) {
        odgovor.status(401).json({ greska: 'Racun je zakljucan' });
        return;
      }

      baza.provjeriKorisnika(korime, lozinka, (greska, korisnik) => {
        if (greska) {
          baza.evidentirajNeuspjesnuPrijavu(korime, zahtjev.ip || '', (err) => {});
          
          baza.brojNeuspjesnihPrijava(korime, (err, broj) => {
            if ( (broj) && broj >= maxNeuspjesne) {
              baza.zakljucajRacun(korime, (err) => {});
              odgovor.status(401).json({ greska: 'Racun je zakljucan zbog previse pokusaja' });
              return;
            }
            odgovor.status(401).json({ greska: 'Netocna lozinka' });
          });
          return;
        }

        baza.ocistiNeuspjesnePrijave(korime, (err) => {});

        const sesija = zahtjev.session as any;
        sesija.korisnik = korisnik;

        odgovor.status(201).json({ poruka: 'Uspjesna prijava', korisnik: korisnik });
      });
    });
  });

  server.put('/rest/korisnici/:korime/odjava', (zahtjev: Request, odgovor: Response) => {
    const sesija = zahtjev.session as any;
    const korime = zahtjev.params.korime;

    if (!sesija.korisnik || sesija.korisnik.korisnicko_ime !== korime) {
      odgovor.status(401).json({ greska: 'Niste prijavljeni' });
      return;
    }

    zahtjev.session.destroy((greska) => {
      if (greska) {
        odgovor.status(500).json({ greska: 'Greska pri odjavi' });
        return;
      }
      odgovor.status(201).json({ poruka: 'Uspjesna odjava' });
    });
  });

  server.get('/api/provjera-sesije', (zahtjev: Request, odgovor: Response) => {
      const sesija = zahtjev.session as any;
      
      if (sesija.korisnik) {
          odgovor.json({
              prijavljen: true,
              korisnik: sesija.korisnik
          });
      } else {
          odgovor.json({
              prijavljen: false
          });
      }
  });
}
