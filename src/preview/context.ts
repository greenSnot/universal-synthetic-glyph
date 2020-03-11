import { observable } from 'mobx';
import { Size, TopLeftPoint, BottomLeftPoint, GlyphStroke } from '../types';

export class PreviewContext {
  @observable strokes: GlyphStroke[] = [];
  @observable viewport_size: Size = {
    width: NaN,
    height: NaN,
  };
  @observable zoom = NaN;
  @observable display_offset: TopLeftPoint = {
    x: NaN,
    y: NaN,
  };
}
