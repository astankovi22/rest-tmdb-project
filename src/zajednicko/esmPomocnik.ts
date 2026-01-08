export function dajPort(ldap: string): number {
  const ascii = ldap.split('').reduce((suma, znak) => suma + znak.charCodeAt(0), 0);
  return 3000 + (ascii % 1000);
}