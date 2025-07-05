import {setConfig} from './state.js';
import {setFullscreenListener} from './fullscreen.ts';
import {enforceIframeHeight} from './iframe.ts';
import {setEnvironmentListener} from './environment.ts';
import {getVersion} from './version.ts';
import {PumpRoomConfig} from './types.ts';
import {initApiClient} from './api-client.ts';

export {setConfig, getCurrentUser} from './state.ts';
export {authenticate} from './auth.ts';
export {setFullscreenListener} from './fullscreen.ts';
export {enforceIframeHeight} from './iframe.ts';
export {getVersion} from './version.ts';
export {getApiClient} from './api-client.ts';
export * from './types.ts';

console.debug('PumpRoom SDK v' + getVersion() + ' loaded');

export function init(cfg: PumpRoomConfig): void {
    setConfig(cfg);
    initApiClient(cfg.apiKey);
    setFullscreenListener();
    setEnvironmentListener();
    if (cfg.minHeight) {
        enforceIframeHeight(cfg.minHeight);
    }
}
