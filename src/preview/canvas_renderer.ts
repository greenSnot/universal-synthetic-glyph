import { Application, particles, Sprite, Graphics, Text } from 'pixi.js';

import { TopLeftPoint, TopLeftBoundingBox, Size } from '../types';
import { random } from '../utils';

export class Renderer {
  renderer: Application | undefined;
  renderer_sprites: particles.ParticleContainer | undefined;
  brush_textures: string[] = [];
  n_brush_texture: number = 0;
  graphics = new Graphics();

  view: HTMLCanvasElement | undefined;

  resize_display_size(size: Size) {
    this.display_size = size;
    this.renderer && this.renderer.renderer.resize(size.width, size.height);
  }

  resize_viewport_size(size: Size) {
    this.viewport_size = size;
    if (!this.view) {
      return;
    }
    this.view.style.width = `${size.width}px`;
    this.view.style.height = `${size.height}px`;
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
    this.renderer.stage.position.x = - offset.x;
    this.renderer.stage.position.y = - offset.y;
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

  constructor(public viewport_size: Size, public display_size: Size, canvas_dom?: HTMLCanvasElement) {
    const canvas = canvas_dom || document.createElement('canvas');
    this.renderer = new Application(
      {
        antialias: false,
        autoStart: false,
        width: display_size.width,
        height: display_size.height,
        backgroundColor: 0x1099bb,
        view: canvas,
        resolution: window.devicePixelRatio,
      },
    );
    (window as any).renderer = this.renderer;
    this.view = canvas;
    canvas.style.width = `${viewport_size.width}px`;
    canvas.style.height = `${viewport_size.height}px`;
    this.renderer_sprites = new particles.ParticleContainer(
      10000,
      {
        scale: true,
        uvs: true,
        position: true,
        rotation: true,
      },
    );
    this.renderer.stage.addChild(this.graphics);
    this.renderer.stage.addChild(this.renderer_sprites);
  }
  set_brush_textures(brush_textures: string[]) {
    this.brush_textures = brush_textures;
    this.n_brush_texture = brush_textures.length;
  }
  draw(scale: number, rotation: number, point_x: number, point_y: number) {
    const dot = Sprite.fromImage(this.brush_textures[Math.floor(this.n_brush_texture * random())]);
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
