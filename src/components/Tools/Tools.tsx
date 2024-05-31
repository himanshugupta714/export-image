import React from "react";
import { ToolBox } from "./enum";

const Toolbox: React.FC<{ onSelectTool: (tool: ToolBox) => void }> = ({
  onSelectTool,
}) => {
  return (
    <div className="toolbox">
      <button onClick={() => onSelectTool(ToolBox.SQUARE)}>
        Square Selection
      </button>
      <button onClick={() => onSelectTool(ToolBox.LASSO)}>Lasso Tool</button>
      <button onClick={() => onSelectTool(ToolBox.LINE)}>Line Tool</button>
    </div>
  );
};

export default Toolbox;
