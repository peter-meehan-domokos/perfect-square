'use client'
import { CALC_CELL_MARGIN } from "../../../perfect-square/constants";
import { TransformFn, SecondOrderTransformFn } from "@/app/common-types/function-types";
import { GridStructure, Grid, CellDimensions } from "@/app/common-types/data-types";

const _cellXCalculator : SecondOrderTransformFn<number, number> = (cellWidth) => (colNr) => colNr * cellWidth;
const _cellYCalculator : SecondOrderTransformFn<number, number> = (cellHeight) => (rowNr) => rowNr * cellHeight;

/**
 * @description A function that calculates the dimensions of grid that will havw the optimal aspect-ratio for
 * displaying the given number of cells in the given space
 * @param {Number} width the width of the space
 * @param {Number} height the height of the space
 * @param {Number} nrCells the number of cells to be displayed
 * 
 * @return {object} the properties of the grid, along with some utility functions
 */
const calcGrid = (width : number, height : number, nrCells = 1): Grid => {
    const structure = calcGridStructure(width, height, nrCells);
    const cellDimensions = calcCellDimensions(width, height, structure);
    //utility functions
    const _cellX = _cellXCalculator(cellDimensions.cellWidth);
    const _cellY = _cellYCalculator(cellDimensions.cellHeight);
    const _rowNr : TransformFn<number, number> = cellIndex => Math.floor(cellIndex / structure.nrCols);
    const _colNr : TransformFn<number, number> = cellIndex => cellIndex % structure.nrCols;
  
  return { 
    //GridStructure type
    ...structure, 
    nrCells, 
    //CellDimensions type
    ...cellDimensions, 
    //GridUtilityFunctions type
    _cellX, 
    _cellY, 
    _rowNr, 
    _colNr
  }
};


  /**
 * @description Calculates the optimum number of rows and columns for a given number of cells within a space
 *
 * @param {object} width the width of the space
 * @param {object} height the height of the space
 * @param {object} nrCells the number of cells that are required to fit in the space
 * 
 * @returns {object} contains the values for the optimum number of rows and columns
 */
function calcGridStructure(width : number, height : number, nrCells : number):GridStructure {
  const aspectRatio = width / height;
  const proportionOfCellsForWidth = Math.sqrt(nrCells * aspectRatio);
  const nrCols = Math.round(proportionOfCellsForWidth);
  //always round up the rows so there is enough cells
  const nrRows = Math.ceil(nrCells/nrCols);
  //@todo - consider adjusting cols if ther is an orphan on last row ie 
  //const nrOnLastRow = n - (nrRows-1) * nrCols;
  return { nrCols, nrRows, nrCells }
}

  /**
 * @description Calculates the cell dimensions for a given GridStructure and a number of cells
 * @param {object} width the width of the grid
 * @param {object} height
 * @param {object} GridStructure the object containing the width and height of the space
 * @param {object} nrCells the number of cells that are required to fit in the space
 * 
 * @returns {object} contain s the values for the optimum number of rows and columns
 */
function calcCellDimensions(width : number, height : number, structure : GridStructure):CellDimensions {
  const cellWidth = width/structure.nrCols;
  const cellHeight = height/structure.nrRows;
  const cellMargin = CALC_CELL_MARGIN(cellWidth, cellHeight);
  return {
    cellWidth,
    cellHeight,
    cellMargin
  }
}

export default calcGrid;