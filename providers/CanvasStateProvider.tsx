"use client"
import React, { useContext, createContext } from 'react'


const Canvas = createContext<unknown>(undefined);

const CanvasStateProvider = ({ children }: { children: React.ReactNode }) => {
    const [CanvasBoard, setCanvasBoard] = React.useState({
        scale: 1,
        scaleLock: false,
        objects: [],
    });
  return (
    <Canvas.Provider value={{ CanvasBoard, setCanvasBoard }}>
      {children}
    </Canvas.Provider>
  )
}

export const useCanvasState = () => useContext(Canvas);

export default CanvasStateProvider