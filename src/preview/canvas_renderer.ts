import { Application, particles, Sprite, Graphics, Text } from 'pixi.js';

import { TopLeftBoundingBox, Size } from '../types';
import { random } from '../utils';

export class Renderer {
  renderer: Application | undefined;
  renderer_sprites: particles.ParticleContainer | undefined;
  brush_textures: string[] = [];
  n_brush_texture: number = 0;
  graphics = new Graphics();

  view: HTMLCanvasElement | undefined;

  resize(size: Size) {
    this.size = size;
    if (!this.view) {
      return;
    }
    this.view.style.width = `${this.size.width}px`;
    this.view.style.height = `${this.size.height}px`;
    this.renderer && this.renderer.renderer.resize(this.size.width, this.size.height);
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

  constructor(public size: Size, canvas_dom?: HTMLCanvasElement) {
    const canvas = canvas_dom || document.createElement('canvas');
    this.renderer = new Application(
      {
        antialias: false,
        autoStart: false,
        width: this.size.width,
        height: this.size.height,
        backgroundColor: 0x1099bb,
        view: canvas,
        resolution: window.devicePixelRatio,
      },
    );
    this.view = canvas;
    canvas.style.width = `${this.size.width}px`;
    canvas.style.height = `${this.size.height}px`;
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
    // call me before drawing
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
};
