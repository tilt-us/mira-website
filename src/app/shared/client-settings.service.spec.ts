import { TestBed } from '@angular/core/testing';
import { Mock, vi } from 'vitest';

import {
  CLIENT_SETTINGS_API,
  ClientSettingsApi,
  ClientSettingsService,
} from './client-settings.service';
import { ThemeService } from './theme.service';
import { WallpaperService } from './wallpaper.service';

describe('ClientSettingsService', () => {
  let service: ClientSettingsService;
  let read: Mock;
  let write: Mock;

  beforeEach(() => {
    localStorage.clear();
    read = vi.fn();
    write = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        ClientSettingsService,
        ThemeService,
        WallpaperService,
        { provide: CLIENT_SETTINGS_API, useValue: { read, write } },
      ],
    });
    service = TestBed.inject(ClientSettingsService);
  });

  it('starts empty', () => {
    expect(service.settings()).toBeNull();
    expect(service.isLoaded()).toBe(false);
  });

  it('applies accent and wallpaper from the loaded record', async () => {
    read.mockResolvedValue({
      accentColor: '#123456',
      background: 'yuna',
      resolution: '1920x1080',
    });

    const settings = await service.load();

    expect(settings?.resolution).toBe('1920x1080');
    expect(service.isLoaded()).toBe(true);
    expect(TestBed.inject(ThemeService).accent()).toBe('#123456');
    expect(TestBed.inject(WallpaperService).wallpaper()).toBe('yuna');
  });

  it('treats an empty response body as an empty record', async () => {
    read.mockResolvedValue(undefined);

    await service.load();

    expect(service.settings()).toEqual({});
  });

  it('falls back to defaults when the record cannot be read', async () => {
    read.mockRejectedValue(new Error('offline'));

    const settings = await service.load();

    expect(settings).toBeNull();
    expect(service.isLoaded()).toBe(false);
    expect(TestBed.inject(ThemeService).accent()).toBe('#f2c45b');
  });

  it('sends the stored client values back together with the change', async () => {
    read.mockResolvedValue({
      accentColor: '#ffffff',
      resolution: '2560x1440',
      uiScale: 1.25,
      folders: [{ name: 'Duo', friendPublicIds: [7] }],
    });
    write.mockResolvedValue({ accentColor: '#ff0000' });

    await service.save({ accentColor: '#ff0000' });

    expect(write).toHaveBeenCalledWith({
      accentColor: '#ff0000',
      resolution: '2560x1440',
      uiScale: 1.25,
      folders: [{ name: 'Duo', moveHereWhen: undefined, friendPublicIds: [7] }],
    });
    expect(service.settings()).toEqual({ accentColor: '#ff0000' });
  });

  it('drops folders the backend returned without a name', async () => {
    read.mockResolvedValue({ folders: [{ friendPublicIds: [1] }] });
    write.mockResolvedValue({});

    await service.save({ background: 'lira' });

    expect(write).toHaveBeenCalledWith({ background: 'lira' });
  });

  it('keeps the merged values when the update returns no body', async () => {
    read.mockResolvedValue({ language: 'de' });
    write.mockResolvedValue(undefined);

    const saved = await service.save({ uiScale: 1.5 });

    expect(saved).toEqual({ language: 'de', uiScale: 1.5 });
    expect(service.settings()).toEqual({ language: 'de', uiScale: 1.5 });
  });

  it('saves on top of the cached record when re-reading fails', async () => {
    read.mockResolvedValueOnce({ screenMode: 'windowed' });
    await service.load();

    read.mockRejectedValueOnce(new Error('offline'));
    write.mockResolvedValue({});

    await service.save({ language: 'en' });

    expect(write).toHaveBeenCalledWith({ screenMode: 'windowed', language: 'en' });
  });

  it('refuses to save when no record is known', async () => {
    read.mockRejectedValue(new Error('offline'));

    await expect(service.save({ language: 'en' })).rejects.toThrow('offline');
    expect(write).not.toHaveBeenCalled();
  });

  it('clears the record on reset', async () => {
    read.mockResolvedValue({ accentColor: '#123456' });
    await service.load();

    service.reset();

    expect(service.settings()).toBeNull();
    expect(TestBed.inject(ThemeService).accent()).toBe('#f2c45b');
  });
});

describe('CLIENT_SETTINGS_API', () => {
  const originalFetch = globalThis.fetch;
  let fetchMock: Mock;

  function jsonResponse(body: unknown): Response {
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }

  beforeEach(() => {
    // A Response body can only be read once, so every call gets a fresh one.
    fetchMock = vi.fn(async () => jsonResponse({ accentColor: '#123456' }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('reads and writes through the generated settings endpoints', async () => {
    const api = TestBed.inject<ClientSettingsApi>(CLIENT_SETTINGS_API);

    expect(await api.read()).toEqual({ accentColor: '#123456' });
    expect(await api.write({ accentColor: '#123456' })).toEqual({ accentColor: '#123456' });

    const [readRequest] = fetchMock.mock.calls[0] as [Request];
    const [writeRequest] = fetchMock.mock.calls[1] as [Request];

    expect(readRequest.url).toContain('/api/me/settings');
    expect(readRequest.method).toBe('GET');
    expect(writeRequest.method).toBe('PUT');
  });
});
