import type { Request, Response, NextFunction } from 'express';

export function zahtijevaPrijavu(zahtjev: Request, odgovor: Response, next: NextFunction): void {
    const sesija = zahtjev.session as any;
    
    if (!sesija.korisnik) {
        odgovor.redirect('/prijava');
        return;
    }
    
    next();
}

export function zahtijevaUlogu(uloge: string[]) {
    return (zahtjev: Request, odgovor: Response, next: NextFunction): void => {
        const sesija = zahtjev.session as any;
        
        if (!sesija.korisnik) {
            odgovor.redirect('/prijava');
            return;
        }
        
        if (!uloge.includes(sesija.korisnik.uloga)) {
            odgovor.status(403).sendFile('public/403.html', { root: '.' });
            return;
        }
        
        next();
    };
}