/**
 * Trigger a file download in the browser.
 * Uses fetch+blob for authenticated/API URLs so cookies are sent and
 * ngrok/localhost both work (HTML `download` on `<a>` often fails for those).
 */
export async function downloadFromUrl(url: string, fileName: string): Promise<void> {
  const safeName = (fileName || "document").replace(/[\r\n"]/g, "_").trim() || "document";

  if (url.startsWith("blob:") || url.startsWith("data:")) {
    triggerAnchorDownload(url, safeName);
    return;
  }

  const response = await fetch(url, {
    method: "GET",
    credentials: "same-origin",
    headers: {
      // Free ngrok otherwise returns an HTML interstitial for some navigations.
      "ngrok-skip-browser-warning": "true",
    },
  });

  const contentType = response.headers.get("content-type") || "";

  if (!response.ok) {
    let message = `Unable to download file (HTTP ${response.status}).`;
    if (contentType.includes("application/json")) {
      try {
        const data = (await response.json()) as { error?: string };
        if (data.error) message = data.error;
      } catch {
        // Keep status-based message.
      }
    }
    throw new Error(message);
  }

  if (contentType.includes("application/json")) {
    let message = "Unable to download file.";
    try {
      const data = (await response.json()) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      // Keep default message.
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  try {
    triggerAnchorDownload(objectUrl, safeName);
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000);
  }
}

/**
 * Open a document preview in a new tab using fetch+blob so authenticated API routes
 * and ngrok tunnels work reliably (plain `<a href>` navigations often fail).
 */
export async function previewFromUrl(url: string): Promise<void> {
  if (url.startsWith("blob:") || url.startsWith("data:")) {
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }

  const response = await fetch(url, {
    method: "GET",
    credentials: "same-origin",
    headers: {
      "ngrok-skip-browser-warning": "true",
    },
  });

  const contentType = response.headers.get("content-type") || "";

  if (!response.ok) {
    let message = `Unable to open preview (HTTP ${response.status}).`;
    if (contentType.includes("application/json")) {
      try {
        const data = (await response.json()) as { error?: string };
        if (data.error) message = data.error;
      } catch {
        // Keep status-based message.
      }
    }
    throw new Error(message);
  }

  if (contentType.includes("application/json")) {
    let message = "Unable to open preview.";
    try {
      const data = (await response.json()) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      // Keep default message.
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const previewWindow = window.open(objectUrl, "_blank", "noopener,noreferrer");
  if (!previewWindow) {
    URL.revokeObjectURL(objectUrl);
    throw new Error("Unable to open preview. Allow pop-ups for this site and try again.");
  }

  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}

function triggerAnchorDownload(href: string, fileName: string) {
  const anchor = window.document.createElement("a");
  anchor.href = href;
  anchor.download = fileName;
  anchor.rel = "noopener";
  window.document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}
