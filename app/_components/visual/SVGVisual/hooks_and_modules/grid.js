'use client'
import { CALC_CELL_MARGIN } from "../../../perfect-square/constants";

const _cellXCalculator = cellWidth => colNr => colNr * cellWidth;
const _cellYCalculator = cellHeight => rowNr => rowNr * cellHeight;

/**
 * @description A function that calculates the dimensions of grid that will havw the optimal aspect-ratio for
 * displaying the given number of cells in the given space
 * @param {Number} width the width of the space
 * @param {Number} height the height of the space
 * @param {Number} nrCells the number of cells to be displayed
 * 
 * @return {object} the properties of the grid, along with some utility functions
 */
const calcGrid = (width, height, nrCells=0) => {
    const { nrCols, nrRows } = calcNrColsAndRows(width, height, nrCells);
    const cellWidth = width/nrCols;
    const cellHeight = height/nrRows;
    const cellMargin = CALC_CELL_MARGIN(cellWidth, cellHeight);
    const _cellX = _cellXCalculator(cellWidth);
    const _cellY = _cellYCalculator(cellHeight);
    const _rowNr = cellIndex => Math.floor(cellIndex / nrCols);
    const _colNr = cellIndex => cellIndex % nrCols;
  
  return { nrCols, nrRows, nrCells, cellWidth, cellHeight, cellMargin, _cellX, _cellY, _rowNr, _colNr }

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
function calcNrColsAndRows(width, height, nrCells){
  if(!width || !height || !nrCells) { return { nrCols: 1, nrRows: 1 }}
    const aspectRatio = width / height;
    const proportionOfCellsForWidth = Math.sqrt(nrCells * aspectRatio);
    const nrCols = Math.round(proportionOfCellsForWidth);
    //always round up the rows so there is enough cells
    const nrRows = Math.ceil(nrCells/nrCols);
    //@todo - consider adjusting cols if ther is an orphan on last row ie 
    //const nrOnLastRow = n - (nrRows-1) * nrCols;
    return { nrCols, nrRows }
}

export default calcGrid;