const Header = ({ menuItems=[], selected, onSelect, openIntro }) => {
    return (
      <header className="header">
          <button className="intro-link" onClick={openIntro} >
              Back to intro
          </button>
          <div className="vis-title">
            The Perfect Square Examples
          </div>
          <ul className="menu">
              {menuItems.map(item => 
                  <li
                      key={`item-${item.key}`} 
                      className={`item ${selected === item.key ? "selected" : ""}`}
                      onClick = {() => onSelect(item.key)}
                  >
                      {item.name}
                  </li>
              )}
          </ul>
      </header>
    )
  }
  
  export default Header;