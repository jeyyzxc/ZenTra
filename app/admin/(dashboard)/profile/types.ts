export type ProfileRole = 'SUPERADMIN' | 'ADMIN';

export type AdminProfile = {
  id: string;
  email: string;
  fullName: string | null;
  contactNumber: string | null;
  addressRegionCode: string | null;
  addressRegion: string | null;
  addressProvinceCode: string | null;
  addressProvince: string | null;
  addressCityCode: string | null;
  addressCity: string | null;
  addressBarangayCode: string | null;
  addressBarangay: string | null;
  profileImage: string | null;
  role: ProfileRole;
  createdAt: string;
  updatedAt: string;
};

export type UpdateProfileInput = {
  fullName: string;
  contactNumber: string;
  addressRegionCode: string;
  addressRegion: string;
  addressProvinceCode: string;
  addressProvince: string;
  addressCityCode: string;
  addressCity: string;
  addressBarangayCode: string;
  addressBarangay: string;
};

export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
};
