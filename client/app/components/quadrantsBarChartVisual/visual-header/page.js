'use client'
import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import ZoomCtrls from './ZoomCtrls';
import SettingsCtrls from './SettingsCtrls';
import quadrantCtrlsComponent from "./quadrantCtrlsComponent";
import { fadeIn, /*fadeOut*/ } from '@/app/helpers/domHelpers';
import { selectClasses } from '@mui/material';

const quadrantCtrls = quadrantCtrlsComponent();

const QuadrantsBarChartHeader = ({ data={}, settings, zoomTransform, headerExtended=false, selectedQuadrantIndex, onClickZoom, resetZoom, setSettings, setSelectedQuadrantIndex, setHeaderExtended, setTooltipsData }) => { 
    //refs
    const quadrantCtrlsRef = useRef(null);
    const overviewRef = useRef(null);
    //handler
    const toggleHeaderExtended = e => { setHeaderExtended(!headerExtended); }
    //render quadrantCtrls
    useEffect(() => {
        const quadrantCtrlsData = data.categories;
        if(!quadrantCtrlsData){ return; }

        d3.select(quadrantCtrlsRef.current)
            ?.datum(quadrantCtrlsData)
            .call(quadrantCtrls
            .width(159)
            .height(44)
            .margin({ left:0, right: 0, top: 0, bottom:0 })
            .selectedQuadrantIndex(selectedQuadrantIndex)
            .setSelectedQuadrantIndex(setSelectedQuadrantIndex));

    }, [selectedQuadrantIndex, data.categories])

    useEffect(() => {
      //delay needed to coincide with quadrantCtrlsComponent
      d3.select(overviewRef.current)
        .call(fadeIn, { transition:{ duration:300, delay:450 } })
    },[])

  return (
      <div className={`viz-header ${headerExtended ? "extended" : ""}`}>
        <div className="viz-overview" ref={overviewRef}>
          {data.key && 
            <div className="title-and-description" >
              <div className="viz-title">
                {data.title?.map((line, i) => 
                  <div className="title-line" key={`title-line-${i}`}>{line}</div> )
                }
              </div>
              <div
                className={`desc-btn ${headerExtended ? "to-hide" : "to-show"}`}
                onClick={toggleHeaderExtended}
              >
                {`${headerExtended ? "Hide" : "Show"} Description`}
              </div>
              <div className={`viz-desc ${headerExtended ? "extended" : ""}`}>
                {data.desc?.map((line, i) => 
                  <div className="desc-line" key={`desc-line-${i}`}>{line}</div> )
                }
              </div>
            </div>
          }
        </div>
        <div className="visual-ctrls">
          <div className="interaction-ctrls">
            <div className="quadrant-ctrls">
              <div className="ctrls-section-label">Select</div>
              <div className="quadrant-ctrls-diagram">
                <svg ref={quadrantCtrlsRef}></svg>
              </div>
            </div>
            <ZoomCtrls zoomTransform={zoomTransform}  onClickZoom={onClickZoom} resetZoom={resetZoom} />
          </div>
          <SettingsCtrls settings={settings} setSettings={setSettings} setTooltipsData={setTooltipsData} />
        </div>
      </div>
  )
}

export default QuadrantsBarChartHeader;


