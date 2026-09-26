export type Severity = 'critical' | 'high' | 'medium' | 'low';

export interface CveEntry {
  id: string;
  library: string;
  language: string | null;
  attackClass: string;
  year: number;
  cvss: number | null;
  severity: Severity | null;
  rootCause: string | null;
  patchStatus: string;
  patchedVersion: string | null;
  advisoryURL: string;
  relatedTo: string[];
  notable: string | null;
}
