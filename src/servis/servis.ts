import type { Application, Request, Response } from 'express';
import { Konfiguracija } from '../zajednicko/konfiguracija.js';
import { TMDBServis } from './tmdb.js';
import { Baza } from '../zajednicko/baza.js';


const express = require('express');

export function pripremiPutanjeServis(server: Application, konf: Konfiguracija): void {
  const tmdb = new TMDBServis(konf);
  const appStranicenje = parseInt(konf.daj('appStranicenje'));

  server.get('/api/serije', async (zahtjev: Request, odgovor: Response) => {
    const query = zahtjev.query.q as string;
    const stranica = parseInt(zahtjev.query.stranica as string) || 1;

    if (!query || query.length < 2) {
      odgovor.json({ greska: 'Potrebno je unijeti barem 2 znaka' });
      return;
    }

    try {
      const tmdbOdgovor = await tmdb.pretraziSerije(query, stranica);
      const rezultat = tmdb.prilagodiStranicenje(tmdbOdgovor, appStranicenje);
      odgovor.json(rezultat);
    } catch (greska) {
      odgovor.status(500).json({ greska: 'Greska pri dohvatu serija' });
    }
  });
}