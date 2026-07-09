export type AdminRole = 'SUPERADMIN' | 'ADMIN';

export type TeamMemberStatus =
  | 'PENDING_SETUP'
  | 'ACTIVE'
  | 'TEMP_ACCESS'
  | 'PASSWORD_RESET_REQUIRED'
  | 'DISABLED'
  | 'LOCKED'
  | 'INVITATION_EXPIRED'
  | 'RESET_EXPIRED';

export type TeamMember = {
  id: string;
  fullName: string | null;
  email: string;
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
  role: AdminRole;
  status: TeamMemberStatus;
  mustChangePassword: boolean;
  lastPasswordChangedAt: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export type TeamDeliveryWarning = string | null;

export type InviteTeamMemberResult = {
  member: TeamMember;
  deliveryWarning: TeamDeliveryWarning;
};

export type TeamAccessActionResult = {
  success: true;
  deliveryWarning: TeamDeliveryWarning;
};

export type CreateTeamMemberInput = {
  fullName: string;
  email: string;
  contactNumber?: string;
  role: AdminRole;
};

export type UpdateTeamMemberInput = {
  id: string;
  fullName: string;
  email: string;
  contactNumber: string;
  role: AdminRole;
  status: TeamMemberStatus;
};
