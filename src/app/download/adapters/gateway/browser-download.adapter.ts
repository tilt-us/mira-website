import { DOCUMENT, inject } from '@angular/core';

import type { DownloadGateway } from '../../domain/ports';

/** Outbound adapter: navigates the browser window to the download URL. */
export function createDownloadGateway(): DownloadGateway {
  const document = inject(DOCUMENT);

  return {
    trigger: (url) => {
      document.defaultView?.location.assign(url);
    },
  };
}
