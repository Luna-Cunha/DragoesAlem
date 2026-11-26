/**
 * Normalizes a user-provided 5etools data URL into a direct raw base URL
 * pointing at the `data` directory without a trailing slash.
 *
 * Supported formats:
 * - https://github.com/owner/repo/tree/branch/data
 * - https://github.com/owner/repo/blob/branch/data/...
 * - https://github.com/owner/repo
 * - https://raw.githubusercontent.com/owner/repo/branch/data
 * - https://cdn.jsdelivr.net/gh/owner/repo@branch/data
 * - Any direct HTTP(S) static base URL ending with /data (or custom mirror root)
 */
export function normalizeFiveToolsDataUrl(rawInput: string): string {
  const trimmed = rawInput.trim().replace(/\/+$/, '');
  if (!trimmed) {
    throw new Error('Please enter a data source URL.');
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error('Invalid URL format. Include https:// at the start.');
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('URL must use http:// or https://.');
  }

  if (parsed.hostname === 'github.com' || parsed.hostname === 'www.github.com') {
    const segments = parsed.pathname.split('/').filter(Boolean);
    if (segments.length < 2) {
      throw new Error('GitHub URL must include owner and repository name.');
    }
    const [owner, repo, kind, branch, ...rest] = segments;
    const cleanRepo = repo.replace(/\.git$/, '');

    if ((kind === 'tree' || kind === 'blob') && branch) {
      const subPath = rest.length > 0 ? rest.join('/') : 'data';
      return `https://raw.githubusercontent.com/${owner}/${cleanRepo}/${branch}/${subPath}`.replace(/\/+$/, '');
    }

    return `https://raw.githubusercontent.com/${owner}/${cleanRepo}/main/data`;
  }

  return trimmed;
}
