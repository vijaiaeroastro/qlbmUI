export const expectedHelperVersion = "0.1.0";

export function helperVersionNotice(installedVersion) {
  if (!installedVersion) {
    return `Helper version unavailable. Upgrade to v${expectedHelperVersion}.`;
  }

  if (installedVersion === expectedHelperVersion) {
    return "";
  }

  return `Helper v${installedVersion} detected. Upgrade to v${expectedHelperVersion}.`;
}
