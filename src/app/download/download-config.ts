const LOCAL_DOWNLOAD_BASE_URL = 'http://localhost:8090';

let runtimeDownloadBaseUrl = LOCAL_DOWNLOAD_BASE_URL;

export function applyRuntimeDownloadConfig(downloadBaseUrl: string): void {
  runtimeDownloadBaseUrl = downloadBaseUrl.replace(/\/$/, '');
}

export function getDownloadBaseUrl(): string {
  return runtimeDownloadBaseUrl;
}

export function resetRuntimeDownloadConfig(): void {
  runtimeDownloadBaseUrl = LOCAL_DOWNLOAD_BASE_URL;
}
