
export const openIndexedDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("EcommerceDB", 1);
        request.onupgradeneeded = (event) => {
            const db = request.result;
            if (!db.objectStoreNames.contains("products")){
                db.createObjectStore("products", { keyPath: "id"});
            }
        };
        request.onsuccess = (event) => resolve(request.result);
        request.onerror = (event) => reject (request.error);
    });
};