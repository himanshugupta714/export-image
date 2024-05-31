import React from "react";
import { ToolBox } from "./enum";

const Toolbox: React.FC<{ onSelectTool: (tool: ToolBox) => void }> = ({
  onSelectTool,
}) => {
  return (
    <div>
      <button onClick={() => onSelectTool(ToolBox.SQUARE)}>
        Square Selection
      </button>
      <button onClick={() => onSelectTool(ToolBox.LASSO)}>Lasso Tool</button>
    </div>
  );
};

export default Toolbox;
