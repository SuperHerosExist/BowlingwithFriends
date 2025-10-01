// Admin Configuration
// Add authorized admin email addresses here
export const ADMIN_EMAILS = [
  // Add your admin email(s) here
  // Example: 'admin@example.com',
   'davesfx@gmail.com',
   'daves.seeker@gmail.com',
];

// Check if a user is an admin
export const isAdmin = (user) => {
  if (!user || !user.email) return false;
  return ADMIN_EMAILS.includes(user.email.toLowerCase());
};
