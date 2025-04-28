
/**
 * @description Renders a third part Slider that contains the intro text to the app
 * 
 * @param {function} closeIntro a handler that sets the state in the parent to close the intro and render the visual
 * 
 * @returns {HTMLElement} A div containing a React-Slick Slider component
 */

//@todo - add container div for controls
 const Controls = ({ buttons=[], id="" }) => {
    return (
        <>
            {buttons.map((btn,i) => 
                <div className={btn.className} key={`${id}-${i}`}>
                    <button 
                        onClick={btn.onClick} 
                        style={btn.style}
                    >
                        {btn.label}
                    </button>
                </div>
            )}
        </>
    )
}
  
export default Controls;