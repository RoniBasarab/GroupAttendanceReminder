// API request/response DTOs shared by the app and the server. App-safe (no Node deps).

export type MemberRole = 'admin' | 'member';

export type GroupDto = { id: string; name: string; joinCode: string };

export type MemberDto = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: MemberRole;
};

export type CreateGroupRequest = {
  groupName: string;
  firstName: string;
  lastName: string;
  email: string;
};

export type JoinGroupRequest = {
  joinCode: string;
  firstName: string;
  lastName: string;
  email: string;
};

/** Returned by create/join — includes the one-time device token to store on the device. */
export type AuthSession = { deviceToken: string; member: MemberDto; group: GroupDto };

/** Returned by GET /api/me — no token (the client already holds it). */
export type SessionInfo = { member: MemberDto; group: GroupDto };
