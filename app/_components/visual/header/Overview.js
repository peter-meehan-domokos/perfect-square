'use client'
import React from 'react';
import Fade from '@mui/material/Fade';
import { robotoFont, robotoBoldFont } from '@/app/assets/fonts';

/**
 * @description This component renders....
 *
 * @param {string} name .....
 * @returns {ReactNode} A React element that renders....
 * 
 */
const Overview = ({ title=[], desc=[], headerExtended=false, toggleHeaderExtended }) => {
    return (
        <Fade appear={true} in={true} timeout={{ enter: 1200, exit:400 }}>
            <div className="vis-overview">
                <div className="title-and-description" >
                <div className="vis-title">
                    {title?.map((line, i) => <div className={`title-line ${robotoBoldFont.className}`} key={`title-line-${i}`}>{line}</div> )}
                </div>
                {desc?.length > 0 &&
                    <div
                        className={`desc-btn ${headerExtended ? "to-hide" : "to-show"}`}
                        onClick={toggleHeaderExtended}
                    >
                        {`${headerExtended ? "Hide" : "Show"} Description`}
                    </div>
                }
                <div className={`vis-desc ${headerExtended ? "extended" : ""}`}>
                    {desc?.map((line, i) => <div className={`desc-line ${robotoFont.className}`} key={`desc-line-${i}`}>{line}</div> )}
                </div>
                </div>
            </div> 
        </Fade>
    )
}

export default Overview;


