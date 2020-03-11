import { Application, Sprite, Graphics, Text, ParticleContainer } from 'pixi.js';
import * as PIXI from 'pixi.js';

import { TopLeftPoint, TopLeftBoundingBox, Size } from '../types';
import { random } from '../utils';

export class Renderer {
  renderer: Application | undefined;
  renderer_sprites: ParticleContainer | undefined;
  container: PIXI.Container | undefined;

  brush_textures: string[] = [];
  n_brush_texture: number = 0;
  graphics = new Graphics();

  view: HTMLCanvasElement | undefined;

  resize_viewport_size(size: Size) {
    this.viewport_size = size;
    this.renderer!.renderer.resize(size.width, size.height);
  }

  draw_bounding_box(box: TopLeftBoundingBox) {
    const graphics = this.graphics;
    graphics.lineStyle(1, 0xfffff0, 1);
    graphics.moveTo(box.offset_x, box.offset_y);
    graphics.lineTo(box.offset_x + box.width, box.offset_y);
    graphics.lineTo(box.offset_x + box.width, box.offset_y + box.height);
    graphics.lineTo(box.offset_x, box.offset_y + box.height);
    graphics.lineTo(box.offset_x, box.offset_y);
  }

  update_offset(offset: TopLeftPoint) {
    if (!this.renderer) {
      return;
    }
    this.container!.position.x = - offset.x;
    this.container!.position.y = - offset.y;
    this.do_draw();
  }

  update_scale(scale: number) {
    if (!this.renderer) {
      return;
    }
    this.renderer.stage.scale.x = scale;
    this.renderer.stage.scale.y = scale;
    this.do_draw();
  }

  constructor(public viewport_size: Size, canvas_dom?: HTMLCanvasElement) {
    const canvas = canvas_dom || document.createElement('canvas');
    this.renderer = new Application(
      {
        antialias: false,
        autoStart: false,
        width: viewport_size.width,
        height: viewport_size.height,
        backgroundColor: 0x1099bb,
        autoDensity: true,
        view: canvas,
        resolution: window.devicePixelRatio,
      },
    );
    this.view = canvas;
    canvas.style.width = `${viewport_size.width}px`;
    canvas.style.height = `${viewport_size.height}px`;
    this.container = new PIXI.Container();
    this.renderer_sprites = new ParticleContainer(
      10000,
      {
        scale: true,
        uvs: true,
        position: true,
        rotation: true,
      } as any,
    );
    this.container.addChild(this.graphics);
    this.container.addChild(this.renderer_sprites!);
    this.renderer.stage.addChild(this.container!);

    (window as any).r = this.renderer;
  }
  set_brush_textures(brush_textures: string[]) {
    this.brush_textures = brush_textures;
    this.n_brush_texture = brush_textures.length;
  }
  draw(scale: number, rotation: number, point_x: number, point_y: number) {
    const dot = Sprite.from(this.brush_textures[Math.floor(this.n_brush_texture * random())]);
    dot.scale.x = scale;
    dot.scale.y = scale;

    dot.anchor.set(0.5);

    dot.x = point_x;
    dot.y = point_y;
    this.renderer_sprites && this.renderer_sprites.addChild(dot);
  }
  clear() {
    this.graphics.clear();
    this.renderer_sprites && this.renderer_sprites.removeChildren();
  }
  do_draw() {
    this.renderer && this.renderer.render();
  }
}

export class RendererWithStaffs extends Renderer {
  /*
  bounding_box_graphics = new Graphics();
  draw_staff(offset_y: number, interval: number) {
    const graphics = this.graphics;
    graphics.lineStyle(1, 0xffd900, 1);
    const n_staff = 5;
    for (let i = 0; i < n_staff; ++i) {
      const height = offset_y + interval * i;
      graphics.beginFill(0xFF3300);
      graphics.moveTo(0, height);
      graphics.lineTo(this.size.width, height);
      graphics.endFill();
    }
  }
   */
};
