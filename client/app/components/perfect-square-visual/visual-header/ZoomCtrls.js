'use client'
import React, { } from 'react';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import { resetIcon } from "../../../assets/svgIcons";
import { COLOURS } from "../../../constants";
const { BLUE, GREY } = COLOURS;

const ZoomCtrls = ({ zoomTransform={}, /*onClickZoom,*/ resetZoom }) => { 
  const { x, y, k } = zoomTransform;
  const isZoomedOrPanned = x || y || k > 1;
  return (
    <div className="zoom-ctrls">
        <div className="ctrls-section-label">Reset Zoom</div>
        <div className="zoom-btns">
          {/**<div className="zoom-icon">
              <RemoveCircleIcon onClick={() => onClickZoom("out")}/>
          </div>*/}
          <div className="zoom-reset-icon" style={{ cursor: isZoomedOrPanned ? "pointer" : null }}>
            <svg width={resetIcon.width} height={resetIcon.height} onClick={resetZoom} >
              <path d={resetIcon.path.d} fill={isZoomedOrPanned ? BLUE : GREY} style={{ transition:"fill 200ms"}}
                fillRule={resetIcon.path.fillrule} transform={resetIcon.path.transform} 
              />
            </svg>
          </div>
          {/**<div className="zoom-icon">
              <AddCircleIcon onClick={() => onClickZoom("in")} />
          </div>*/}
        </div>
    </div>   
  )
}

export default ZoomCtrls;


