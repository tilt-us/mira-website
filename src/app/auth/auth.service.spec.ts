import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { vi } from 'vitest';

import { AuthService } from './auth.service';

// The Angular vitest builder forbids vi.mock for relative imports, so the
// service is tested through a fetch stub that answers for the generated SDK
// and the Keycloak token endpoint.
function fakeJwt(payload: Record<string, unknown>): string {
  const encode = (value: Record<string, unknown>) =>
    btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  return `${encode({ alg: 'none' })}.${encode(payload)}.signature`;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

interface FetchStub {
  settings: Record<string, unknown>;
  profile: Record<string, unknown>;
  failSettingsRead: boolean;
  settingsPuts: Record<string, unknown>[];
  usernamePuts: Record<string, unknown>[];
  tagIdPuts: Record<string, unknown>[];
}

function installFetchStub(): FetchStub {
  const stub: FetchStub = {
    settings: {},
    profile: { displayName: 'Mira Player', tagId: 'TAG-001', email: 'player@tilt-us.com' },
    failSettingsRead: false,
    settingsPuts: [],
    usernamePuts: [],
    tagIdPuts: [],
  };

  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = input instanceof Request ? input : undefined;
      const url = new URL(request?.url ?? String(input));
      const method = (request?.method ?? init?.method ?? 'GET').toUpperCase();
      const readBody = async (): Promise<Record<string, unknown>> => {
        const raw = request ? await request.text() : String(init?.body ?? '{}');
        return JSON.parse(raw) as Record<string, unknown>;
      };

      if (url.pathname.endsWith('/protocol/openid-connect/token')) {
        return jsonResponse({
          access_token: fakeJwt({
            iss: 'https://api.tilt-us.com/keycloak/realms/mira',
            exp: Math.floor(Date.now() / 1000) + 3600,
          }),
          expires_in: 3600,
        });
      }

      if (url.pathname === '/api/public/login-options') {
        return jsonResponse({ providers: [] });
      }

      if (url.pathname === '/api/me/settings' && method === 'GET') {
        if (stub.failSettingsRead) {
          return jsonResponse({ message: 'offline' }, 503);
        }

        return jsonResponse(stub.settings);
      }

      if (url.pathname === '/api/me/settings' && method === 'PUT') {
        stub.settingsPuts.push(await readBody());
        return jsonResponse(stub.settings);
      }

      if (url.pathname === '/api/me/username' && method === 'PUT') {
        const body = await readBody();
        stub.usernamePuts.push(body);
        stub.profile = { ...stub.profile, displayName: body['username'] };
        return jsonResponse(stub.profile);
      }

      if (url.pathname === '/api/me/tag-id' && method === 'PUT') {
        const body = await readBody();
        stub.tagIdPuts.push(body);
        stub.profile = { ...stub.profile, tagId: body['tagId'] };
        return jsonResponse(stub.profile);
      }

      if (url.pathname === '/api/me') {
        return jsonResponse(stub.profile);
      }

      return jsonResponse({ message: `Unhandled request: ${method} ${url.pathname}` }, 404);
    }),
  );

  return stub;
}

describe('AuthService', () => {
  let service: AuthService;
  let fetchStub: FetchStub;

  beforeEach(async () => {
    localStorage.clear();
    sessionStorage.clear();
    fetchStub = installFetchStub();

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [AuthService],
    });
    service = TestBed.inject(AuthService);
    await service.ensureInitialized();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('starts logged out', () => {
    expect(service.isLoggedIn()).toBe(false);
    expect(service.user()).toBeNull();
  });

  it('opens the auth popup on login', () => {
    const openPopupSpy = vi.spyOn(service, 'openLoginPopup');

    service.login();

    expect(openPopupSpy).toHaveBeenCalled();
  });

  it('logs in with password and loads the profile', async () => {
    await service.loginWithPassword('player', 'secret');

    expect(service.isLoggedIn()).toBe(true);
    expect(service.user()?.displayName).toBe('Mira Player');
  });

  it('sends the full settings record back when saving accent or background', async () => {
    await service.loginWithPassword('player', 'secret');

    fetchStub.settings = {
      resolution: '2560x1440',
      uiScale: 1.25,
      accentColor: '#111111',
      background: 'lira',
      language: 'de',
      chatPosition: 'right',
      folders: [{ name: 'Duo', friendPublicIds: [7] }, { friendPublicIds: [9] }],
    };

    await service.saveProfile({ accentColor: '#ff0000', background: 'yuna' });

    expect(fetchStub.settingsPuts).toHaveLength(1);
    expect(fetchStub.settingsPuts[0]).toEqual(
      expect.objectContaining({
        resolution: '2560x1440',
        uiScale: 1.25,
        language: 'de',
        chatPosition: 'right',
        accentColor: '#ff0000',
        background: 'yuna',
        // Folders without a name cannot be round-tripped and are dropped.
        folders: [{ name: 'Duo', friendPublicIds: [7] }],
      }),
    );
  });

  it('does not touch the settings record when only profile fields change', async () => {
    await service.loginWithPassword('player', 'secret');

    await service.saveProfile({ displayName: 'New Name', tagId: 'TAG-002' });

    expect(fetchStub.usernamePuts).toEqual([{ username: 'New Name' }]);
    expect(fetchStub.tagIdPuts).toEqual([{ tagId: 'TAG-002' }]);
    expect(fetchStub.settingsPuts).toHaveLength(0);
  });

  it('aborts the settings save when the current record cannot be read', async () => {
    await service.loginWithPassword('player', 'secret');

    fetchStub.failSettingsRead = true;

    await expect(service.saveProfile({ accentColor: '#ff0000' })).rejects.toBeTruthy();
    expect(fetchStub.settingsPuts).toHaveLength(0);
  });
});
