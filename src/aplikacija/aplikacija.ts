import type { Application, Request, Response } from 'express';
import path from 'path';
import { zahtijevaPrijavu, zahtijevaUlogu } from '../zajednicko/autorizacija.js';

const express = require('express');

export function pripremiPutanjeAplikacija(server: Application): void {
  server.use(express.static(path.join(__dirname, '../../public')));
  server.use('/dokumentacija', express.static(path.join(__dirname, '../../dokumentacija')));

  server.get('/', (zahtjev: Request, odgovor: Response) => {
    odgovor.sendFile(path.join(__dirname, '../../public/index.html'));
  });

  server.get('/info', (zahtjev: Request, odgovor: Response) => {
    odgovor.sendFile(path.join(__dirname, '../../dokumentacija/dokumentacija.html'));
  });

  server.get('/reg', (zahtjev: Request, odgovor: Response) => {
    odgovor.sendFile(path.join(__dirname, '../../public/registracija.html'));
  });

  server.get('/prijava', (zahtjev: Request, odgovor: Response) => {
    odgovor.sendFile(path.join(__dirname, '../../public/prijava.html'));
  });

  server.get('/odjava', zahtijevaPrijavu, (zahtjev: Request, odgovor: Response) => {
    zahtjev.session.destroy((greska) => {
      odgovor.redirect('/');
    });
  });

  server.get('/detalji', zahtijevaUlogu(['registrirani', 'administrator']), (zahtjev: Request, odgovor: Response) => {
    odgovor.sendFile(path.join(__dirname, '../../public/detalji.html'));
  });

  server.get('/gledano', zahtijevaUlogu(['registrirani', 'administrator']), (zahtjev: Request, odgovor: Response) => {
    odgovor.sendFile(path.join(__dirname, '../../public/gledano.html'));
  });

  server.get('/korisnici', zahtijevaUlogu(['administrator']), (zahtjev: Request, odgovor: Response) => {
    odgovor.sendFile(path.join(__dirname, '../../public/korisnici.html'));
  });
}