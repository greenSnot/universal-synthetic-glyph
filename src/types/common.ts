// origin is at the top left
export type TopLeftPoint = {
  x: number,
  y: number,
};

// origin is at the top left
export type TopLeftOffset = {
  offset_x: number,
  offset_y: number,
}

export type Size = {
  width: number,
  height: number,
};

// origin is at the top left
export interface TopLeftBoundingBox extends Size, TopLeftOffset {}