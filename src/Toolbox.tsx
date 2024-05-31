import React from "react";
import { ToolBox } from "./components/Tools/enum";

const Toolbox: React.FC<{ onSelectTool: (tool: ToolBox) => void }> = ({
  onSelectTool,
}) => {
  return (
    <div className="toolbox">
      <button onClick={() => onSelectTool(ToolBox.SQUARE)}>
        Square Selection
      </button>
      <button onClick={() => onSelectTool(ToolBox.LASSO)}>Lasso Tool</button>
    </div>
  );
};

export default Toolbox;
