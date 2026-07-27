/** Route slugs for the statutory pages; also used as cache keys. */
export type LegalSlug = 'terms-of-use' | 'privacy-policy';

/** One titled block of paragraphs within a statutory document. */
export interface LegalSection {
  readonly heading: string;
  readonly body: readonly string[];
}

/**
 * Shape of a statutory document as served from the backend
 * (`/documents/statutory/*.json`) and mirrored by the local dummy files.
 */
export interface LegalDocument {
  readonly title: string;
  readonly lastUpdated?: string;
  readonly intro?: string;
  readonly sections: readonly LegalSection[];
}
