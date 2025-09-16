import React from 'react'

import NavBarItem from './NavBarItem'

const AnchorLink = ({
  children,
  href,
  onClick,
  className,
  icon,
  tabIndex,
  testId,
}) => {
  return (
    <a href={href} onClick={onClick}>
      <NavBarItem
        href={href}
        className={className}
        icon={icon}
        tabIndex={tabIndex}
        testId={testId}
      >
        {children}
      </NavBarItem>
    </a>
  )
}

export default AnchorLink
