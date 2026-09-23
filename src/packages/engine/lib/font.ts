export class BitmapFont8x8 {
  public drawText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    color: string = '#FFFFFF',
    withShadow: boolean = true
  ): void {
    ctx.font = '8px "Courier New", monospace';
    ctx.textBaseline = 'top';

    if (withShadow) {
      ctx.fillStyle = '#000000';
      ctx.fillText(text, x + 1, y + 1);
      ctx.fillText(text, x + 1, y);
      ctx.fillText(text, x, y + 1);
    }

    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  }

  public drawCenteredText(
    ctx: CanvasRenderingContext2D,
    text: string,
    centerX: number,
    y: number,
    color: string = '#FFFFFF',
    withShadow: boolean = true
  ): void {
    ctx.font = '8px "Courier New", monospace';
    ctx.textBaseline = 'top';
    const metrics = ctx.measureText(text);
    const x = Math.round(centerX - metrics.width / 2);
    this.drawText(ctx, text, x, y, color, withShadow);
  }
}
