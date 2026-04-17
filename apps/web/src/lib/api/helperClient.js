async function request(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof body === "object" && body?.error ? body.error : `Request failed: ${response.status}`;
    throw new Error(message);
  }

  return body;
}

export function normalizeBaseUrl(url) {
  return url.replace(/\/$/, "");
}

export function checkHealth(baseUrl) {
  return request(normalizeBaseUrl(baseUrl), "/health");
}

export function listRuns(baseUrl) {
  return request(normalizeBaseUrl(baseUrl), "/runs");
}

export function createRun(baseUrl, payload) {
  return request(normalizeBaseUrl(baseUrl), "/runs", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getRun(baseUrl, runId) {
  return request(normalizeBaseUrl(baseUrl), `/runs/${runId}`);
}

export function listArtifacts(baseUrl, runId) {
  return request(normalizeBaseUrl(baseUrl), `/runs/${runId}/artifacts`);
}

export function artifactUrl(baseUrl, runId, relativePath) {
  return `${normalizeBaseUrl(baseUrl)}/runs/${runId}/file?path=${encodeURIComponent(relativePath)}`;
}

export function deleteRun(baseUrl, runId) {
  return request(normalizeBaseUrl(baseUrl), `/runs/${runId}`, {
    method: "DELETE"
  });
}

export function deleteRuns(baseUrl, runIds) {
  return request(normalizeBaseUrl(baseUrl), "/runs/delete", {
    method: "POST",
    body: JSON.stringify({ run_ids: runIds })
  });
}

export function deleteAllRuns(baseUrl) {
  return request(normalizeBaseUrl(baseUrl), "/runs", {
    method: "DELETE"
  });
}
