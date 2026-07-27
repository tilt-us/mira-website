export interface AuthUser {
  readonly displayName?: string;
  readonly email?: string;
  readonly tagId?: string;
  readonly publicId?: number;
  readonly preferredUsername?: string;
  readonly avatarUrl?: string;
  readonly avatarRightsConsented?: boolean;
}

export interface RegisterPayload {
  readonly displayName: string;
  readonly email: string;
  readonly password: string;
}
