export function retrieveData(key: string): Record<any, any> | null {
    if (typeof localStorage === 'undefined') return null;
    try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as Record<any, any>) : null;
    } catch (err) {
        console.error('Cache read error', err);
        return null;
    }
}

export function storeData(key: string, data: Record<any, any>): void {
    if (typeof localStorage === 'undefined') return;
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (err) {
        console.error('Cache save error', err);
    }
}
