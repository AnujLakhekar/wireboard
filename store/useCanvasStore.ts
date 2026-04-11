import { create } from "zustand";

interface CanvasObject {
  id: string;
  [key: string]: any;
}

interface CanvasState {
  objects: CanvasObject[];
  objectsById: Record<string, CanvasObject>;
  selectedIds: string[];
  setObjects: (
    objects: CanvasObject[] | ((objects: CanvasObject[]) => CanvasObject[]),
  ) => void;
  updateObject: (id: string, updates: Partial<CanvasObject>) => void;
  setSelectedIds: (ids: string[]) => void;
  addObject: (obj: CanvasObject) => void;
}

const normalizeObjects = (objects: CanvasObject[]) => {
  const uniqueObjects = Array.from(
    new Map(objects.map((object) => [object.id, object])).values(),
  );
  const objectsById = uniqueObjects.reduce<Record<string, CanvasObject>>(
    (accumulator, object) => {
      accumulator[object.id] = object;
      return accumulator;
    },
    {},
  );

  return { objects: uniqueObjects, objectsById };
};

export const useCanvasStore = create<CanvasState>((set) => ({
  objects: [],
  objectsById: {},
  selectedIds: [],
  setObjects: (objects) =>
    set((state) => {
      const nextObjects =
        typeof objects === "function" ? objects(state.objects) : objects;
      const normalized = normalizeObjects(nextObjects);

      return {
        objects: normalized.objects,
        objectsById: normalized.objectsById,
      };
    }),
  setSelectedIds: (ids) => set({ selectedIds: ids }),
  updateObject: (id, updates) =>
    set((state) => {
      const currentObject = state.objectsById[id];

      if (!currentObject) {
        return {};
      }

      const updatedObject = { ...currentObject, ...updates };

      return {
        objects: state.objects.map((object) =>
          object.id === id ? updatedObject : object,
        ),
        objectsById: {
          ...state.objectsById,
          [id]: updatedObject,
        },
      };
    }),
  addObject: (obj) =>
    set((state) => {
      const normalized = normalizeObjects([...state.objects, obj]);

      return {
        objects: normalized.objects,
        objectsById: normalized.objectsById,
      };
    }),
}));