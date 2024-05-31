import React, { useState } from "react";
import { useDrawing } from "../../hooks/useDrawing";
import Canvas from "../Canvas";
import { useImage } from "../../hooks/useImage";
import { ToolBox } from "../Tools/enum";
import Toolbox from "../Tools/Tools";

const Drawing: React.FC = () => {
  const { image, handleImageUpload } = useImage();
  const [tool, setTool] = useState<ToolBox>(ToolBox.LASSO);

  const {
    canvasRef,
    imgRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    redrawImage,
    rect,
    points,
    offsetXRef,
    offsetYRef,
    setRect,
  } = useDrawing(tool, image);

  const exportSelection = () => {
    if (!canvasRef.current || !imgRef.current) return;
    const canvas = canvasRef.current;
    const img = imgRef.current;
    const offscreenCanvas = document.createElement("canvas");
    const offscreenContext = offscreenCanvas.getContext("2d");
    if (!offscreenContext) return;

    const imgWidth = img.naturalWidth;
    const imgHeight = img.naturalHeight;

    const scale = Math.min(canvas.width / imgWidth, canvas.height / imgHeight);

    if (tool === ToolBox.LASSO && points.length >= 3) {
      offscreenCanvas.width = imgWidth;
      offscreenCanvas.height = imgHeight;

      offscreenContext.drawImage(img, 0, 0);
      offscreenContext.globalCompositeOperation = "destination-in";
      offscreenContext.beginPath();
      points.forEach((point, index) => {
        if (index === 0) {
          offscreenContext.moveTo(
            (point.x - offsetXRef.current) / scale,
            (point.y - offsetYRef.current) / scale
          );
        } else {
          offscreenContext.lineTo(
            (point.x - offsetXRef.current) / scale,
            (point.y - offsetYRef.current) / scale
          );
        }
      });
      offscreenContext.closePath();
      offscreenContext.fill();
    } else if (tool === ToolBox.SQUARE && rect) {
      const { startX, startY, width, height } = rect;
      offscreenCanvas.width = width / scale;
      offscreenCanvas.height = height / scale;
      offscreenContext.drawImage(
        img,
        (startX - offsetXRef.current) / scale,
        (startY - offsetYRef.current) / scale,
        width / scale,
        height / scale,
        0,
        0,
        width / scale,
        height / scale
      );
    }

    const croppedImage = offscreenCanvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = croppedImage;
    link.download = "cropped-image.png";
    link.click();

    setRect(null);
    redrawImage();
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleImageUpload} />
      <Toolbox onSelectTool={setTool} />

      <Canvas
        image={image}
        canvasRef={canvasRef}
        imgRef={imgRef}
        handleMouseDown={handleMouseDown}
        handleMouseMove={handleMouseMove}
        handleMouseUp={handleMouseUp}
      />
      <button onClick={exportSelection}>Export Selection</button>
    </div>
  );
};

export default Drawing;
