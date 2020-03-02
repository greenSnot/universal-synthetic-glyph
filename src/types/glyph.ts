import { TopLeftPoint } from './common';

export type GlyphStroke = {
  segments: GlyphSegment[],
  brush_type?: BrushType,
}

export type GlyphSegment = {
  weight_graph?: {
    keypoints: TopLeftPoint[],
    equation: number[],
  },
  control_point_a: TopLeftPoint,
  pivot_point: TopLeftPoint,
  control_point_b: TopLeftPoint,
};

export enum BrushType {
  default = 0
};

export type GlpyhBrushes = {
  type: BrushType,
}[][];

export type GlyphData = {
  strokes: GlyphStroke[];
  bounding_box: {
    offset_x: number,
    offset_y: number,
    width: number,
    height: number,
  }
};