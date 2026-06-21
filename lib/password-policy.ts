export const PASSWORD_POLICY_MESSAGE =
  'Password must be at least 12 characters with uppercase, lowercase, number, and symbol.';

export function isStrongPassword(password: string) {
  return (
    password.length >= 12 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

export function assertStrongPassword(password: string) {
  if (!isStrongPassword(password)) {
    throw new Error(PASSWORD_POLICY_MESSAGE);
  }
}
