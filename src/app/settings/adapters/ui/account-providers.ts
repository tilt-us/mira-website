/** External services a user will be able to link (placeholder for now). */
export interface AccountProvider {
  readonly id: string;
  readonly label: string;
}

export const ACCOUNT_PROVIDERS: readonly AccountProvider[] = [
  { id: 'google', label: 'Google' },
  { id: 'discord', label: 'Discord' },
  { id: 'github', label: 'GitHub' },
  { id: 'gitlab', label: 'GitLab' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'x', label: 'X' },
];
