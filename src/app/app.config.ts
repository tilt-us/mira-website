import {
  APP_INITIALIZER,
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';
import { applyRuntimeApiConfig, reconfigureClientConfig, setApiAccessToken } from './api-client';
import { applyKeycloakRuntimeConfig } from './auth/adapters/identity/config';
import { applyRuntimeDownloadConfig } from './download/download-config';
import { loadRuntimeConfig } from './runtime-config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: () => async () => {
        const runtimeConfig = await loadRuntimeConfig();
        applyRuntimeApiConfig(runtimeConfig.apiBaseUrl);
        applyRuntimeDownloadConfig(runtimeConfig.downloadBaseUrl);
        applyKeycloakRuntimeConfig(runtimeConfig);
        reconfigureClientConfig();
        setApiAccessToken(undefined);
      },
    },
  ],
};
