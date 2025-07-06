declare module 'highlightjs-copy' {
    /** Доступные опции плагина */
    export interface CopyButtonPluginOptions {
        /** Функция-перехватчик перед вставкой текста в буфер */
        hook?: (text: string, el: HTMLElement) => string | void;
        /** Колбэк после копирования */
        callback?: (text: string, el: HTMLElement) => void;
        /** Автоматически скрывать кнопку после копирования */
        autohide?: boolean;          // ← добавили
    }

    /** Плагин «Кнопка копирования» для Highlight.js */
    class CopyButtonPlugin {
        constructor(options?: CopyButtonPluginOptions);
    }

    export = CopyButtonPlugin;
}
