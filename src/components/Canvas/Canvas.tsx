import React from "react";
import { CanvasProps } from "./types";

const Canvas: React.FC<CanvasProps> = ({
  image,
  canvasRef,
  imgRef,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  redrawImage,
}) => {
  return (
    <>
      <canvas
        ref={canvasRef}
        width={1200}
        height={700}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
      <img
        ref={imgRef}
        src={image as string}
        style={{ display: "none" }}
        alt="uploaded"
        onLoad={redrawImage}
      />
    </>
  );
};

export default Canvas;
