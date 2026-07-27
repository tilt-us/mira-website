import { InjectionToken } from '@angular/core';

import type { Build } from './models';
import { createLocalBuildsGateway } from '../adapters/gateway/local-builds.adapter';

/**
 * Outbound port for builds. The community list is read-only; own builds are
 * read and written back as a whole. Swapping the factory below for an HTTP
 * adapter is all it takes to move off the local mock once the backend exposes
 * builds.
 */
export interface BuildsGateway {
  listCommunity(): Promise<readonly Build[]>;
  listOwn(): Promise<readonly Build[]>;
  replaceOwn(builds: readonly Build[]): Promise<void>;
}

export const BUILDS_GATEWAY = new InjectionToken<BuildsGateway>('BUILDS_GATEWAY', {
  providedIn: 'root',
  factory: createLocalBuildsGateway,
});
