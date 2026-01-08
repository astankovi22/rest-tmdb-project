CREATE TABLE IF NOT EXISTS korisnik (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    korisnicko_ime TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    lozinka TEXT NOT NULL,
    sol TEXT NOT NULL,
    ime TEXT,
    prezime TEXT,
    datum_rodenja TEXT,
    uloga TEXT DEFAULT 'registrirani',
    datum_registracije TEXT DEFAULT CURRENT_TIMESTAMP,
    aktivan INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS sesija (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    korisnik_id INTEGER NOT NULL,
    token TEXT UNIQUE NOT NULL,
    vrijedi_do TEXT NOT NULL,
    FOREIGN KEY (korisnik_id) REFERENCES korisnik(id)
);

CREATE TABLE IF NOT EXISTS neuspjesne_prijave (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    korisnicko_ime TEXT NOT NULL,
    vrijeme TEXT DEFAULT CURRENT_TIMESTAMP,
    ip_adresa TEXT
);