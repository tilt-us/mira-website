import { DISCORD_INVITE_URL } from './community';

describe('community constants', () => {
  it('points DISCORD_INVITE_URL at a real discord.gg invite', () => {
    expect(DISCORD_INVITE_URL).toMatch(/^https:\/\/discord\.gg\/[A-Za-z0-9]+$/);
  });
});
