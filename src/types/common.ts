// origin is at the top left
export type TopLeftPoint = {
  x: number,
  y: number,
};

// origin is at the bottom left
export type BottomLeftPoint = {
  x: number,
  y: number,
};

export type TopLeftOffset = {
  offset_x: number,
  offset_y: number,
}

export type BottomLeftOffset = {
  offset_x: number,
  offset_y: number,
}

export type Size = {
  width: number,
  height: number,
};

export interface TopLeftBoundingBox extends Size, TopLeftOffset {}
export interface BottomLeftBoundingBox extends Size, BottomLeftOffset {}
