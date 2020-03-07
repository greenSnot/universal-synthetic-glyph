import { BottomLeftBoundingBox, BottomLeftPoint } from './common';

export type GlyphStroke = {
  segments: GlyphSegment[];
  brush_type?: BrushType;
};

export type GlyphSegment = {
  deviation_graph: {
    key_points: BottomLeftPoint[];
    equation: number[];
  };
  weight_graph: {
    key_points: BottomLeftPoint[];
    equation: number[];
  };
  control_point_a: BottomLeftPoint;
  pivot_point: BottomLeftPoint;
  control_point_b: BottomLeftPoint;
  brush_type?: BrushType;
};

export enum BrushType {
  default = 0,
}

export type GlyphData = {
  strokes: GlyphStroke[];
  brush_type?: BrushType;
  bounding_box: BottomLeftBoundingBox;
};
