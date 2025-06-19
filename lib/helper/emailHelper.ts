export function getDomainFromEmail(email: string) {
  if (!email.includes("@")) return null;
  return email.split("@")[1].toLowerCase();
}   


export function getOrganizationName(email: string): string | null {
  if (!email.includes('@')) return null;
  const domain = email.split('@')[1].toLowerCase();
 
  // Take only the domain part before the first dot
  const orgName = domain.split('.')[0];
 
  // Clean up and return
  return orgName;
}