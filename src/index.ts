import {setConfig} from './state.js';
import {handleFullscreenToggle} from './fullscreen.ts';
import {enforceIframeHeight} from './iframe.ts';
import {listenEnvironment} from './environment.ts';
import {getVersion} from './version.ts';
import {PumpRoomConfig} from './types.ts';

export {setConfig, getCurrentUser} from './state.ts';
export {authenticate} from './auth.ts';
export {handleFullscreenToggle} from './fullscreen.ts';
export {enforceIframeHeight} from './iframe.ts';
export {getVersion} from './version.ts';
export * from './types.ts';

export function init(cfg: PumpRoomConfig): void {
    setConfig(cfg)
    handleFullscreenToggle();
    listenEnvironment();
    if (cfg.minHeight) {
        enforceIframeHeight(cfg.minHeight);
    }
}
