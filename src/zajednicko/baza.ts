import sqlite3 from 'sqlite3';
import fs from 'fs';
import crypto from 'crypto';

export class Baza {
    private db: sqlite3.Database;

    constructor(putanja: string) {
        this.db = new sqlite3.Database(putanja);
        this.inicijaliziraj();
    }

    private inicijaliziraj(): void {
        const sql = fs.readFileSync('dokumentacija/baza.sql', 'utf-8');
        
        this.db.exec(sql, (greska) => {
            if (greska) {
                console.error('Greska pri inicijalizaciji baze:', greska);
                return;
            }
            this.kreirajTestneKorisnike();
        });
    }

    private kreirajTestneKorisnike(): void {
        this.db.get('SELECT * FROM korisnik WHERE korisnicko_ime = ?', ['obican'], (greska, red) => {
            if (!red) {
                const sol1 = this.generirajSol();
                const lozinka1 = this.hashLozinka('rwa', sol1);
                
                this.db.run(
                    'INSERT INTO korisnik (korisnicko_ime, email, lozinka, sol, ime, prezime, datum_rodenja, uloga) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    ['obican', 'obican@example.com', lozinka1, sol1, 'Obican', 'Korisnik', '1990-01-01', 'registrirani']
                );
            }
        });

        this.db.get('SELECT * FROM korisnik WHERE korisnicko_ime = ?', ['admin'], (greska, red) => {
            if (!red) {
                const sol2 = this.generirajSol();
                const lozinka2 = this.hashLozinka('rwa', sol2);
                
                this.db.run(
                    'INSERT INTO korisnik (korisnicko_ime, email, lozinka, sol, ime, prezime, datum_rodenja, uloga) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    ['admin', 'admin@example.com', lozinka2, sol2, 'Admin', 'Administrator', '1985-01-01', 'administrator']
                );
            }
        });
    }

    generirajSol(): string {
        return crypto.randomBytes(16).toString('hex');
    }

    hashLozinka(lozinka: string, sol: string): string {
        return crypto.pbkdf2Sync(lozinka, sol, 1000, 64, 'sha512').toString('hex');
    }

    dohvatiSveKorisnike(callback: (greska: Error | null, korisnici?: any[]) => void): void {
        this.db.all('SELECT id, korisnicko_ime, email, ime, prezime, datum_rodenja, uloga, aktivan FROM korisnik', (greska, redovi) => {
            if (greska) {
                callback(greska);
                return;
            }
            callback(null, redovi);
        });
    }

    dohvatiKorisnika(korime: string, callback: (greska: Error | null, korisnik?: any) => void): void {
        this.db.get(
            'SELECT id, korisnicko_ime, email, ime, prezime, datum_rodenja, uloga, aktivan FROM korisnik WHERE korisnicko_ime = ?',
            [korime],
            (greska, red) => {
                if (greska) {
                    callback(greska);
                    return;
                }
                callback(null, red);
            }
        );
    }

    registrirajKorisnika(
        korisnickoIme: string,
        email: string,
        lozinka: string,
        ime: string,
        prezime: string,
        datumRodenja: string,
        callback: (greska: Error | null, id?: number) => void
    ): void {
        this.db.get(
            'SELECT * FROM korisnik WHERE korisnicko_ime = ? OR email = ?',
            [korisnickoIme, email],
            (greska, red) => {
                if (greska) {
                    callback(greska);
                    return;
                }

                if (red) {
                    callback(new Error('Korisnicko ime ili email vec postoji'));
                    return;
                }

                const sol = this.generirajSol();
                const hashiranaLozinka = this.hashLozinka(lozinka, sol);

                this.db.run(
                    'INSERT INTO korisnik (korisnicko_ime, email, lozinka, sol, ime, prezime, datum_rodenja) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [korisnickoIme, email, hashiranaLozinka, sol, ime, prezime, datumRodenja],
                    function(greska) {
                        if (greska) {
                            callback(greska);
                            return;
                        }
                        callback(null, this.lastID);
                    }
                );
            }
        );
    }

    azurirajKorisnika(
        korime: string,
        email: string,
        ime: string,
        prezime: string,
        datumRodenja: string,
        callback: (greska: Error | null) => void
    ): void {
        this.db.run(
            'UPDATE korisnik SET email = ?, ime = ?, prezime = ?, datum_rodenja = ? WHERE korisnicko_ime = ?',
            [email, ime, prezime, datumRodenja, korime],
            (greska) => {
                callback(greska);
            }
        );
    }

    provjeriKorisnika(
        korisnickoIme: string,
        lozinka: string,
        callback: (greska: Error | null, korisnik?: any) => void
    ): void {
        this.db.get(
            'SELECT * FROM korisnik WHERE korisnicko_ime = ?',
            [korisnickoIme],
            (greska, red: any) => {
                if (greska) {
                    callback(greska);
                    return;
                }

                if (!red) {
                    callback(new Error('Korisnik ne postoji'));
                    return;
                }

                const hashiranaLozinka = this.hashLozinka(lozinka, red.sol);
                
                if (hashiranaLozinka === red.lozinka) {
                    callback(null, {
                        id: red.id,
                        korisnicko_ime: red.korisnicko_ime,
                        email: red.email,
                        uloga: red.uloga
                    });
                } else {
                    callback(new Error('Netocna lozinka'));
                }
            }
        );
    }

    provjeriAktivnost(korime: string, callback: (greska: Error | null, aktivan?: boolean) => void): void {
        this.db.get('SELECT aktivan FROM korisnik WHERE korisnicko_ime = ?', [korime], (greska, red: any) => {
            if (greska || !red) {
                callback(greska || new Error('Korisnik ne postoji'));
                return;
            }
            callback(null, red.aktivan === 1);
        });
    }

    evidentirajNeuspjesnuPrijavu(korime: string, ip: string, callback: (greska: Error | null) => void): void {
        this.db.run(
            'INSERT INTO neuspjesne_prijave (korisnicko_ime, ip_adresa) VALUES (?, ?)',
            [korime, ip],
            (greska) => {
                callback(greska);
            }
        );
    }

    brojNeuspjesnihPrijava(korime: string, callback: (greska: Error | null, broj?: number) => void): void {
        this.db.get(
            'SELECT COUNT(*) as broj FROM neuspjesne_prijave WHERE korisnicko_ime = ? AND datetime(vrijeme) > datetime("now", "-30 minutes")',
            [korime],
            (greska, red: any) => {
                if (greska) {
                    callback(greska);
                    return;
                }
                callback(null, red.broj);
            }
        );
    }

    zakljucajRacun(korime: string, callback: (greska: Error | null) => void): void {
        this.db.run('UPDATE korisnik SET aktivan = 0 WHERE korisnicko_ime = ?', [korime], (greska) => {
            callback(greska);
        });
    }

    otkljucajRacun(korime: string, callback: (greska: Error | null) => void): void {
        this.db.run('UPDATE korisnik SET aktivan = 1 WHERE korisnicko_ime = ?', [korime], (greska) => {
            callback(greska);
        });
    }

    ocistiNeuspjesnePrijave(korime: string, callback: (greska: Error | null) => void): void {
        this.db.run('DELETE FROM neuspjesne_prijave WHERE korisnicko_ime = ?', [korime], (greska) => {
            callback(greska);
        });
    }

    zatvori(): void {
        this.db.close();
    }
}