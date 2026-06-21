export type AdminRole = 'SUPERADMIN' | 'ADMIN';

export type TeamMember = {
  id: string;
  username: string;
  email: string;
  role: AdminRole;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export type CreateTeamMemberInput = {
  username: string;
  email: string;
  password: string;
  role: AdminRole;
};

export type UpdateTeamMemberInput = {
  id: string;
  username: string;
  email: string;
  password?: string;
  role: AdminRole;
};
