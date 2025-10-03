// Admin Configuration
// Super Admin has full control including assigning admin roles
export const SUPER_ADMIN_EMAIL = 'davesfx@gmail.com';

// Add authorized admin email addresses here
export const ADMIN_EMAILS = [
  SUPER_ADMIN_EMAIL,
  'daves.seeker@gmail.com',
];

// Check if a user is a super admin
export const isSuperAdmin = (user) => {
  if (!user || !user.email) return false;
  return user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
};

// Check if a user is an admin (includes super admin)
export const isAdmin = (user) => {
  if (!user || !user.email) return false;
  return ADMIN_EMAILS.includes(user.email.toLowerCase());
};
