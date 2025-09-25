// src/store/contactStore.ts
import create from 'zustand';
import API from '../api';

export type Contact = {
    idContact: number;
    Name: string;
    EmailAddress?: string | null;
    Title?: string | null;
    Department?: string | null;
    idUnit?: number | null;
};

type ContactState = {
    loaded: boolean;
    byId: Record<number, Contact>;
    all: Contact[];
    get: (id?: number | null) => Contact | undefined;
    setMany: (rows: Contact[]) => void;
    loadAll: () => Promise<void>;
    refresh: () => Promise<void>; // alias that forces reload
    upsertOne: (row: Contact) => void;
    upsertMany: (rows: Contact[]) => void;
};

export const useContactStore = create<ContactState>((set, get) => ({
    loaded: false,
    byId: {},
    all: [],
    get: (id) => (id ? get().byId[id] : undefined),

    setMany: (rows) => set(() => ({
        loaded: true,
        all: rows.slice().sort((a, b) => a.Name.localeCompare(b.Name)),
        byId: Object.fromEntries(rows.map(r => [r.idContact, r])),
    })),

    loadAll: async () => {
        if (get().loaded) return;                     // already cached
        const resp = await API.getContacts();
        if (resp?.success && Array.isArray(resp.data)) {
            get().setMany(resp.data as Contact[]);
        } else {
        // optional: keep loaded=false so a later call can retry
            console.warn('[contacts] failed to load all contacts');
        }
    },

    refresh: async () => {
        const resp = await API.getContacts();
        if (resp?.success && Array.isArray(resp.data)) {
            get().setMany(resp.data as Contact[]);
        }
    },

    upsertOne: (row) => set((s) => {
        const byId = { ...s.byId, [row.idContact]: row };
        // keep all sorted by Name
        const map = new Map<number, Contact>(s.all.map(c => [c.idContact, c]));
        map.set(row.idContact, row);
        const all = Array.from(map.values()).sort((a,b)=>a.Name.localeCompare(b.Name));
        return { byId, all, loaded: true };
    }),
    upsertMany: (rows) => set((s) => {
        const byId = { ...s.byId };
        const map = new Map<number, Contact>(s.all.map(c => [c.idContact, c]));
        for (const r of rows) { byId[r.idContact] = r; map.set(r.idContact, r); }
        const all = Array.from(map.values()).sort((a,b)=>a.Name.localeCompare(b.Name));
        return { byId, all, loaded: true };
    }),
}));

export const contactLabel = (c?: Contact): string =>
    c ? `${c.Name}${c.EmailAddress ? ` (${c.EmailAddress})` : ''}` : '';
