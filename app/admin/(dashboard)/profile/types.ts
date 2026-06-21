export type ProfileRole = 'SUPERADMIN' | 'ADMIN';

export type AdminProfile = {
  id: string;
  username: string;
  email: string;
  fullName: string | null;
  contactNumber: string | null;
  role: ProfileRole;
  createdAt: string;
  updatedAt: string;
};

export type UpdateProfileInput = {
  fullName: string;
  contactNumber: string;
};

export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
};
