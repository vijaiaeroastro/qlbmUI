export function decodeConnectionCode(value) {
  if (!value) {
    throw new Error("Missing connection code");
  }

  try {
    return atob(value.trim());
  } catch {
    throw new Error("Invalid connection code");
  }
}
