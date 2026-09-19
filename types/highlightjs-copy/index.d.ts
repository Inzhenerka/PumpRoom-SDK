declare module "highlightjs-copy" {
  /** Плагин «Кнопка копирования» для Highlight.js */
  class CopyButtonPlugin {
    constructor(options?: CopyButtonPlugin.Options);
  }

  namespace CopyButtonPlugin {
    /** Доступные опции плагина */
    interface Options {
      /** Функция-перехватчик перед вставкой текста в буфер */
      hook?: (text: string, el: HTMLElement) => string | void;
      /** Колбэк после копирования */
      callback?: (text: string, el: HTMLElement) => void;
      /** Автоматически скрывать кнопку после копирования */
      autohide?: boolean;
    }
  }

  export = CopyButtonPlugin;
}
