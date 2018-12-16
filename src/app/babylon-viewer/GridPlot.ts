export class GridPlot {
  constructor(public x: number, public y: number,
              public width: number, public height: number,
              public filledBy: number) {
  }

  public clone(): GridPlot {
    return new GridPlot(this.x, this.y, this.width, this.height, this.filledBy);
  }

  public overlaps(x: number, y: number): boolean {
    return this.overlapsX(x) && this.overlapsY(y);
  }

  public overlapsX(x: number): boolean {
    return (x >= this.x) && (x < (this.x + this.width));
  }

  public overlapsY(y: number): boolean {
    return (y >= this.y) && (y < (this.y + this.height));
  }
}

