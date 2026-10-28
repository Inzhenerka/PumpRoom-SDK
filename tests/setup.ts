// Browser APIs used by the SDK that happy-dom does not implement yet.
window.alert = () => {};

Object.defineProperty(globalThis, "PageTransitionEvent", {
  configurable: true,
  writable: true,
  value: class extends Event {
    readonly persisted: boolean;

    constructor(type: string, options: PageTransitionEventInit = {}) {
      super(type, options);
      this.persisted = options.persisted ?? false;
    }
  },
});
