import React from 'react';

export default function ProgressLayer({ className, style, children }) {
  return (
    <div className={`custom-pane ${className}`} style={style}>
      {children}
    </div>
  );
}

ProgressLayer.defaultProps = {
  style: {
    position: 'absolute',
    zIndex: 900, // above the MapPane
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
};
