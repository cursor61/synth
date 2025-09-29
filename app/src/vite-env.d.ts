/// <reference types="vite/client" />

declare global {
  interface Window {
    synthIPC?: {
      onGlobalKey: (cb: (e: { keycode?: number }) => void) => void
      onGlobalMouseDown: (cb: (e: any) => void) => void
      onGlobalMouseMove: (cb: (e: { x: number, y: number }) => void) => void
      onGlobalWheel: (cb: (e: { amount: number, direction: number }) => void) => void
    }
  }
}

export {}
