import { create } from "zustand";


interface Settings {
 save: {
    autoSave: boolean;
    autoSaveInterval: number;
 },
 tools :{
    pen: {
        size: number;
        color: string;
    };
    eraser: {
        size: number;
    };
 }
}