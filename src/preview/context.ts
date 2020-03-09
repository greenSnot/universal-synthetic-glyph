import { observable } from 'mobx';
import { Size, TopLeftPoint, BottomLeftPoint, GlyphStroke } from '../types';

export class PreviewContext {
  @observable strokes: GlyphStroke[] = [];
  @observable size: Size = {
    width: 200,
    height: 200,
  };
  @observable zoom = 1;
  @observable display_offset: TopLeftPoint = {
    x: 0,
    y: 0,
  };
}
