'use client'
import React, { } from 'react';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import Checkbox from '@mui/material/Checkbox';
import { SETTINGS_OPTIONS } from "../constants.js";

//these objects are applied to the checkbox and label roots, using the sx prop
//see https://www.youtube.com/watch?v=gw30zyh3Irw&t=806s
const medScreenCheckboxFormGroupStyle = {
  border:"solid", borderColor:"red", 
  display:"flex", flexDirection:"row", justifyContent:"space-around", alignItems:"center"

}
const largeScreenCheckboxFormGroupStyle = {
  width:"80px",
  display:"flex", flexDirection:"column", justifyContent:"space-around", alignItems:"flex-start"

}
const checkboxStyle = {
  '& .MuiSvgIcon-root': { fontSize: "14px" }
}
const FormControlLabelStyle = {
  '& .MuiFormControlLabel-label': { fontSize: "8px" }
}

const SettingsCtrls = ({ settings, setSettings }) => {
  const handleSettingsChange = (checkboxKey, checkboxValue) => {
    //helper
    setSettings(prevState => {
      const { x, y } = prevState.arrangeBy;
      //helpers (note - value here will be the arrangeBy key or "")
      const replaceX = value => ({ ...prevState, arrangeBy:{ x:value, y }});
      const replaceY = value => ({ ...prevState, arrangeBy:{ x, y:value }});
      if(checkboxValue === true){
        //put in x if available, else put in y
        return !x ? replaceX(checkboxKey) : replaceY(checkboxKey);
      }else{
        //find where it is and remove it
        return x === checkboxKey ? replaceX("") : replaceY("")
      }
    })
  }

  const renderSettingsList = () => (
    <>
      {SETTINGS_OPTIONS.arrangeBy.map(option => 
        <FormControlLabel 
          control={<Checkbox 
            sx={checkboxStyle} 
            checked={Object.values(settings.arrangeBy).includes(option.key)}
            onChange={(e, value) => handleSettingsChange(option.key, value)}
          />} 
          label={option.label} 
          sx={FormControlLabelStyle}
          disabled={option.disabled}
          key={`settings-option-${option.key}`}
        />
      )}
    </>
  )

  return (
    <div className="setting-ctrls">
      <div className="toggles-area">
        <div className="ctrls-section-label">Arrange By</div>
        <div className="lg-up">
          <FormGroup sx={largeScreenCheckboxFormGroupStyle}>
            {renderSettingsList()}
          </FormGroup>
        </div>
        <div className="md-down">
          <FormGroup sx={medScreenCheckboxFormGroupStyle} >
            {renderSettingsList()}
          </FormGroup>
        </div>
      </div>
    </div>  
  )
}

export default SettingsCtrls;


