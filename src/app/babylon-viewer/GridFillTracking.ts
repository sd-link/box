export class GridFillTracking {
  cells: number[][];
  cellsAvailable: number;

  /**
   * @param width The number of cell columns
   * @param height The number of cell rows
   * @param filledBy When placing on another grid, this ID will be used to mark the cells of that grid
   * @param requiredHeight (for grids from gridPatternRequired) The available height required on top of a grid in order to be able to place the object this grid belongs to on it. -1 means no value / requirement
   * @param maxHeight (for grids from gridsProvided) The limit of how high objects can be placed on this grid. -1 means no value / limit
   */
  constructor(public width: number, public height: number, public filledBy: number, public requiredHeight: number, public maxHeight: number) {
    this.cells = [];
    this.cellsAvailable = width * height;

    for (let y = 0; y < height; ++y) {
      const row: number[] = [];

      for (let x = 0; x < width; ++x) {
        row.push(-1);
      }

      this.cells.push(row);
    }
  }
  
  public markCell(x: number, y: number, mark: number) {
      if (this.cells[y][x] === -1) {
          this.cells[y][x] = mark;
          --this.cellsAvailable;
      }
  }
  
  /**
   * When trying to place an object on this grid, first call this method to mark which parts of that object can be supported
   * by this grid (i.e. cells which fall on this grid and are not occupied already by another object)
   * An object can only be placed on grids, if all of its parts are supported (i.e. no parts are out in the air or already taken by other objects)
   * @param ft The grid belonging to the object to place (the cells storing which parts of it are supported - -1 means not supported, 1 means supported)
   * @param relX The X coordinate of the position of the bottom-left corner of the ft grid compared to this grid
   * @param relY The Y coordinate of the position of the bottom-left corner of the ft grid compared to this grid
   * @param relH The vector marking the horizontal direction of this grid compared to the ft grid
   * (to account for rotation - the other grid might be rotated compared to this one) - the X and Z coordinates are considered to be on the plane of the grids, Y is ignored
   * @param relV Same as relH but with the vertical direction
   */
  public markForPlacement(ft: GridFillTracking, relX: number, relY: number, relH: BABYLON.Vector3, relV: BABYLON.Vector3) {
      // calculate the coordinates of the origin cell of the ft grid within our own grid - depending on rotation, 
      // it might be one cell off horizontally and/or vertically compared to the bottom-left corner marked by relX, relY
      let x = relX - (((relV.x < -0.001) || (relV.z < -0.001)) ? 1 : 0);
      let y = relY - (((relH.x < -0.001) || (relH.z < -0.001)) ? 1 : 0);
      // xi, yi are the cell coordinates within the passed ft grid - check for all grids of ft if this grid can support it
      for (let yi = 0; yi < ft.height; ++yi) {
        for (let xi = 0; xi < ft.width; ++xi) {
          // transform cell coordinates from ft grid to this grid
          let lx = Math.round(x + xi * relH.x + yi * relV.x); // local X (X coordinate within out own grid)
          let ly = Math.round(y + xi * relH.z + yi * relV.z); // local Y (Y coordinate within out own grid)
          // are we even within the bounds of this grid? if not, we cannot support this cell
          if ((lx >= 0) && (lx < this.width) && (ly >= 0) && (ly < this.height)) {
            // even if we are within, check if the cell is not occupied by another object already
            const filledBy = this.cells[ly][lx];
            const available = ((filledBy === -1) || (filledBy === ft.filledBy)) && ((this.maxHeight < 0) || (ft.requiredHeight < 0) || (ft.requiredHeight <= this.maxHeight));
            if (available) {
              ft.markCell(xi, yi, 1); // mark this cell of ft as one that can be supported by this grid
            }
          }
        }
      }
  }
  
  public fullyClaimed(): boolean {
      return this.cellsAvailable === 0;
  }
  
  /**
   * When placing an object on grids, call this method to mark which parts of this grid are taken by that object (so that later
   * new objects cannot be placed on the same place)
   * @param ft The grid belonging to the object to place
   * @param relX See markForPlacement()
   * @param relY See markForPlacement()
   * @param relH See markForPlacement()
   * @param relV See markForPlacement()
   * @returns If any cells were taken by the passed object
   */
  public claimForFT(ft: GridFillTracking, relX: number, relY: number, relH: BABYLON.Vector3, relV: BABYLON.Vector3): boolean {
      let result = false;
      // See markForPlacement() to understand the logic here, it is the same
      let x = relX - (((relV.x < -0.001) || (relV.z < -0.001)) ? 1 : 0);
      let y = relY - (((relH.x < -0.001) || (relH.z < -0.001)) ? 1 : 0);
      for (let yi = 0; yi < ft.height; ++yi) {
        for (let xi = 0; xi < ft.width; ++xi) {
            let lx = Math.round(x + xi * relH.x + yi * relV.x); // local X (X coordinate within out own grid)
            let ly = Math.round(y + xi * relH.z + yi * relV.z); // local Y (Y coordinate within out own grid)
            if ((lx >= 0) && (lx < this.width) && (ly >= 0) && (ly < this.height)) {
              const filledBy = this.cells[ly][lx];
              const available = (filledBy === -1) || (filledBy === ft.filledBy);
              if (available) {
                  this.markCell(lx, ly, ft.filledBy); // mark the cell as being taken by the passed object
                  result = true;
              }
            }
        }
      }
      return result;
  }
  
  public freeCells(id: number) {
    this.cells.forEach((row) => {
      row.forEach((filledBy, colIdx) => {
        if (filledBy === id) {
          row[colIdx] = -1;
          ++this.cellsAvailable;
        }
      });
    });
  }
  
}