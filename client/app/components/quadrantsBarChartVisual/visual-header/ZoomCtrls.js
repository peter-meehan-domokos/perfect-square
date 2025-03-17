'use client'
import React, { } from 'react';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';

const ZoomCtrls = ({ value, zoomIn, zoomOut }) => { 

  return (
    <div className="zoom-ctrls">
        <div className="ctrls-section-label">Zoom</div>
        <div className="zoom-btns">
          <div className="zoom-icon">
              <RemoveCircleIcon />
          </div>
          <div className="zoom-scale-display">
              {value.toFixed(1)}
          </div>
          <div className="zoom-icon">
              <AddCircleIcon />
          </div>
        </div>
    </div>   
  )
}

export default ZoomCtrls;


