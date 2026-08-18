import releaseChannel from "@/config/release-channel.json";

export interface AppUpdatePolicy {
  enabled: boolean;
  webReleaseApiUrl: string | null;
  webUpdateInstructionsUrl: string | null;
}

export const appUpdatePolicy: Readonly<AppUpdatePolicy> =
  Object.freeze(releaseChannel);

export function isAppUpdateEnabledForRuntime(
  isDesktopRuntime: boolean,
): boolean {
  if (!appUpdatePolicy.enabled) return false;
  if (isDesktopRuntime) return true;
  return Boolean(
    appUpdatePolicy.webReleaseApiUrl &&
      appUpdatePolicy.webUpdateInstructionsUrl,
  );
}
