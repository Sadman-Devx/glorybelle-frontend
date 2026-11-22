/**
 * GLORYBELLE — public contact details, in one place.
 * Used by /contact, /privacy and /shipping. Override the email per environment
 * with NEXT_PUBLIC_CONTACT_EMAIL; check the defaults below before going live.
 */
export const SITE_NAME = 'GLORYBELLE';
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'info@glorybelle.it';
export const CONTACT_PHONE = '+39 02 1234 5678';
export const CONTACT_PHONE_HREF = 'tel:+390212345678';
