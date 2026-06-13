import { User } from "@auth/core/types";
import { JsonObject } from "@liveblocks/client";
import { Params } from "next/dist/server/request/params";
import { create } from "zustand";


interface LiveState {
  roomId: Params["roomId"];
  setRoomId: (id: Params["roomId"]) => void;
  others: any[];
  setOthers: (others: any[]) => void;
}

export const useLiveStore = create<LiveState>((set) => ({
  roomId: "",
  setRoomId: (id) => set({ roomId: id }),
  others: [],
  setOthers: (others) => set({ others }),
}));