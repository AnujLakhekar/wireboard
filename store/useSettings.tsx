import { create } from "zustand";

type SettingsState = {
    // autosave settings
    save: {
        autoSave: boolean;
        autoSaveInterval: number; // seconds
    };

    // drawing tools
    tools: {
        pen: { size: number; color: string };
        eraser: { size: number };
    };

    // Konva / canvas performance options
    performance: {
        pixelRatio: number; // Konva.pixelRatio
        useLayerListeningFalse: boolean; // set layer.listening(false) when possible
        dragLayerOptimization: boolean; // move shape to dedicated layer while dragging
        cacheShapes: boolean; // shape.cache()
        perfectDrawEnabled: boolean; // shape.perfectDrawEnabled
    };

    // actions
    set: (patch: Partial<SettingsState>) => void;
    reset: () => void;
};

const STORAGE_KEY = "wb_settings";

const defaultState: Omit<SettingsState, "set" | "reset"> = {
    save: { autoSave: true, autoSaveInterval: 10 },
    tools: { pen: { size: 3, color: "#000000" }, eraser: { size: 10 } },
    performance: {
        pixelRatio: 1,
        useLayerListeningFalse: true,
        dragLayerOptimization: true,
        cacheShapes: true,
        perfectDrawEnabled: false,
    },
};

export const useSettings = create<SettingsState>((set, get) => {
    // hydrate from localStorage if available
    let hydrated = defaultState;
    try {
        if (typeof window !== "undefined") {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                hydrated = { ...defaultState, ...parsed };
            }
        }
    } catch (e) {
        // ignore
    }

    // subscribe saver
    const saveToStorage = (state: SettingsState) => {
        try {
            if (typeof window !== "undefined") {
                const copy = { save: state.save, tools: state.tools, performance: state.performance };
                window.localStorage.setItem(STORAGE_KEY, JSON.stringify(copy));
            }
        } catch (e) {
            // ignore
        }
    };

    // create store
    const store = {
        ...hydrated,
        set: (patch: Partial<SettingsState>) => {
            set((s) => {
                const next = { ...s, ...(patch as any) } as SettingsState;
                // persist
                saveToStorage(next);
                return next;
            });
        },
        reset: () => {
            set(() => {
                if (typeof window !== "undefined") {
                    try {
                        window.localStorage.removeItem(STORAGE_KEY);
                    } catch (e) {}
                }
                return defaultState as SettingsState;
            });
        },
    } as SettingsState & { set: (p: Partial<SettingsState>) => void; reset: () => void };

    return store;
});

export default useSettings;