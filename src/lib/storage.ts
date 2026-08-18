/** Read an OAC localStorage value, migrating one legacy key if necessary. */
export function readMigratedStorage(
  key: string,
  legacyKey?: string,
): string | null {
  if (typeof localStorage === "undefined") return null;
  const current = localStorage.getItem(key);
  if (current !== null) {
    if (legacyKey) localStorage.removeItem(legacyKey);
    return current;
  }
  if (!legacyKey) return null;

  const legacy = localStorage.getItem(legacyKey);
  if (legacy === null) return null;
  try {
    localStorage.setItem(key, legacy);
    localStorage.removeItem(legacyKey);
  } catch {
    // Preserve and return the legacy value when storage is read-only or full.
  }
  return legacy;
}

/** Write only the OAC key and remove its legacy alias after a successful write. */
export function writeMigratedStorage(
  key: string,
  value: string,
  legacyKey?: string,
): void {
  localStorage.setItem(key, value);
  if (legacyKey) localStorage.removeItem(legacyKey);
}

/** Remove both generations of a migrated localStorage value. */
export function removeMigratedStorage(key: string, legacyKey?: string): void {
  localStorage.removeItem(key);
  if (legacyKey) localStorage.removeItem(legacyKey);
}
