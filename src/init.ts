import { initApiClient } from "./api-client.ts";
import { setTaskListener } from "./callbacks.ts";
import { setEnvironmentListener } from "./environment.ts";
import { setFullscreenListener } from "./fullscreen.ts";
import { getConfig, setConfig } from "./globals.ts";
import { enforceIframeHeight } from "./iframe.ts";
import type { PumpRoomConfig } from "./types/index.ts";

/**
 * Configure API access and listeners for manually embedded iframes.
 * Call before authenticate() or setUser(). Does not activate SCORM.
 * @category Initialization
 */
export function init(cfg: PumpRoomConfig): void {
  setConfig(cfg);
  const config = getConfig();
  if (!config) throw new Error("SDK configuration failed");
  initApiClient(config.apiKey, config.apiBaseUrl);
  setFullscreenListener();
  setEnvironmentListener();
  setTaskListener();
  if (cfg.minHeight) enforceIframeHeight(cfg.minHeight);
}
