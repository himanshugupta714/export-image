import React from "react";

const Toolbox: React.FC<{ onSelectTool: (tool: string) => void }> = ({
  onSelectTool,
}) => {
  return (
    <div className="toolbox">
      <button onClick={() => onSelectTool("square")}>Square Selection</button>
      <button onClick={() => onSelectTool("lasso")}>Lasso Tool</button>
    </div>
  );
};

export default Toolbox;
