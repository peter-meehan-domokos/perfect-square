'use client'
import React, { useRef } from 'react';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import Checkbox from '@mui/material/Checkbox';
import { DEFAULT_DISPLAY_SETTINGS, SETTINGS_OPTIONS, ARRANGEMENT_OPTIONS } from "../../perfect-square/constants.js";

//these objects are applied to the checkbox and label roots, using the sx prop
//see https://www.youtube.com/watch?v=gw30zyh3Irw&t=806s
const medScreenCheckboxFormGroupStyle = {
  marginBottom:"5px", paddingLeft:"15px",
  display:"flex", flexDirection:"row", justifyContent:"space-around", alignItems:"center",

}
const largeScreenCheckboxFormGroupStyle = {
  width:"100px", paddingLeft:"10px",
  display:"flex", flexDirection:"column", justifyContent:"space-around", alignItems:"flex-start"

}
const checkboxStyle = {
  '& .MuiSvgIcon-root': { fontSize: "14px" }
}
const FormControlLabelStyle = {
  '& .MuiFormControlLabel-label': { fontSize: "9px" }
}

/**
 * @description This component renders....
 *
 * @param {string} name .....
 * @returns {ReactNode} A React element that renders....
 */
const SettingsCtrls = ({ settings=DEFAULT_DISPLAY_SETTINGS, setSettings, setTooltipsData }) => {
  const mouseOverRef = useRef("");
  const handleSettingsChange = (checkboxKey, checkboxValue) => {
    //remove tooltip as it has been clicked
    mouseOverRef.current = "";
    setTooltipsData([]);
    //helper
    setSettings(prevState => {
      const { x, y, colour } = prevState.arrangeBy;
      //helpers (note - value here will be the arrangeBy key or "")
      const replaceX = value => ({ ...prevState, arrangeBy:{ x:value, y, colour }});
      const replaceY = value => ({ ...prevState, arrangeBy:{ x, y:value, colour }});
      const replaceColour = value => ({ ...prevState, arrangeBy:{ x, y, colour:value }});
      if(checkboxValue === true){
        //put in x if available, else put in y, else put in colour
        return !x ? replaceX(checkboxKey) : (!y ? replaceY(checkboxKey) : replaceColour(checkboxKey));
      }else{
        //find where it is and remove it
        return x === checkboxKey ? replaceX("") : ( y === checkboxKey ? replaceY("") : replaceColour(""));
      }
    })
  }

  const handleMouseOver = optKey => {
    mouseOverRef.current = optKey;
    setTimeout(() => {
      if(!mouseOverRef.current === optKey) { return; }
      //note - tooltip key is same for all 3 so it doesnt disappear when going from one to the other
      const option = SETTINGS_OPTIONS.arrangeBy.find(opt => opt.key === optKey);
      const newTooltipDatum = { key:"setting", area:"header", title:option.label, paragraphs:option.desc };
      setTooltipsData(prevState => {
        const currentSettingsTooltip = prevState.find(d => d.key === "setting");
        if(currentSettingsTooltip){
          return prevState.map(d => d.key !== "setting" ? d : newTooltipDatum)
        }else{
          return [...prevState, newTooltipDatum]
        }
      })
    }, 200)
  }

  const handleMouseOut = () => {
    mouseOverRef.current = "";
    setTimeout(() => {
      if(mouseOverRef.current) { return; }
      setTooltipsData(prevState => prevState.filter(d => d.key !== "setting"))
    }, 500)
  }

  const renderSettingsList = () => (
    <>
      {SETTINGS_OPTIONS.arrangeBy.map(option => {
        const { arrangeBy={ x:"", y:"", colour:"" } } = settings;
        const { x, y, colour } = arrangeBy;
        const checked = Object.values(arrangeBy).includes(option.key);
        const arrangementKey = checked && (x === option.key ? "x" :(y === option.key ? "y" : "colour"))
        const arrangement = ARRANGEMENT_OPTIONS.find(ar => ar.key === arrangementKey);
        return(
          <FormControlLabel 
            control={<Checkbox 
              sx={checkboxStyle} 
              checked={checked}
              onChange={(e, value) => handleSettingsChange(option.key, value)}
            />} 
            label={
              <span className="arrangement-label">
                <span className="option-label">{option.label}</span>
                {checked && <span className="arrangement-desc">({arrangement.label})</span>}
              </span>
            }
            sx={FormControlLabelStyle}
            disabled={option.disabled}
            key={`settings-option-${option.key}`}
            onMouseOver={() => handleMouseOver(option.key)}
            onMouseOut={() => handleMouseOut(option.key)}
          />
        )
      })}
    </>
  )

  return (
    <div className="setting-ctrls">
      <div className="toggles-area">
        <div className="ctrls-section-label">Arrange By</div>
        <div className="settings-lg-up">
          <FormGroup sx={largeScreenCheckboxFormGroupStyle}>
            {renderSettingsList()}
          </FormGroup>
        </div>
        <div className="settings-md-down">
          <FormGroup sx={medScreenCheckboxFormGroupStyle} >
            {renderSettingsList()}
          </FormGroup>
        </div>
      </div>
    </div>  
  )
}

export default SettingsCtrls;


