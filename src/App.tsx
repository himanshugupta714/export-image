import React, { useState, useRef, useEffect } from "react";
import { march } from "marching-squares";
import Toolbox from "./Toolbox";

const LassoTool: React.FC = () => {
  const [image, setImage] = useState<string | ArrayBuffer | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  const [tool, setTool] = useState<string>("lasso");
  const [rect, setRect] = useState<{
    startX: number;
    startY: number;
    width: number;
    height: number;
  } | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [startResizeCoords, setStartResizeCoords] = useState<{
    startX: number;
    startY: number;
  } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const scaleRef = useRef<number>(1);
  const offsetXRef = useRef<number>(0);
  const offsetYRef = useRef<number>(0);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const { offsetX, offsetY } = event.nativeEvent;

    if (tool === "square") {
      if (rect && isMouseOnEdge(offsetX, offsetY, rect)) {
        setIsResizing(true);
        setStartResizeCoords({ startX: offsetX, startY: offsetY });
      } else {
        setIsDrawing(true);
        setRect({ startX: offsetX, startY: offsetY, width: 0, height: 0 });
      }
    } else {
      setIsDrawing(true);
      setPoints([{ x: offsetX, y: offsetY }]);
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const { offsetX, offsetY } = event.nativeEvent;

    if (isDrawing && tool === "lasso") {
      setPoints((prevPoints) => [...prevPoints, { x: offsetX, y: offsetY }]);
    } else if (rect && tool === "square") {
      if (isResizing && startResizeCoords) {
        const deltaX = offsetX - startResizeCoords.startX;
        const deltaY = offsetY - startResizeCoords.startY;
        setRect((prevRect) => ({
          ...prevRect!,
          width: prevRect!.width + deltaX,
          height: prevRect!.height + deltaY,
        }));
        setStartResizeCoords({ startX: offsetX, startY: offsetY });
      } else if (isDrawing) {
        const { startX, startY } = rect;
        setRect({
          startX,
          startY,
          width: offsetX - startX,
          height: offsetY - startY,
        });
      }
    }
  };

  const handleMouseUp = () => {
    if (tool === "lasso") {
      setIsDrawing(false);
      smoothPoints();
    } else if (tool === "square") {
      setIsDrawing(false);
      setIsResizing(false);
      redrawImage(); // Redraw the original image without grey overlay
    }
  };

  const isMouseOnEdge = (
    mouseX: number,
    mouseY: number,
    rect: { startX: number; startY: number; width: number; height: number }
  ) => {
    const { startX, startY, width, height } = rect;
    const edgeSize = 10; // size of the edge for resizing

    const onLeftEdge =
      mouseX >= startX - edgeSize && mouseX <= startX + edgeSize;
    const onRightEdge =
      mouseX >= startX + width - edgeSize &&
      mouseX <= startX + width + edgeSize;
    const onTopEdge =
      mouseY >= startY - edgeSize && mouseY <= startY + edgeSize;
    const onBottomEdge =
      mouseY >= startY + height - edgeSize &&
      mouseY <= startY + height + edgeSize;

    return onLeftEdge || onRightEdge || onTopEdge || onBottomEdge;
  };

  const smoothPoints = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;

    const offscreenCanvas = document.createElement("canvas");
    offscreenCanvas.width = canvas.width;
    offscreenCanvas.height = canvas.height;
    const offscreenContext = offscreenCanvas.getContext("2d");
    if (!offscreenContext) return;

    offscreenContext.drawImage(canvas, 0, 0);
    offscreenContext.beginPath();
    points.forEach((point, index) => {
      if (index === 0) {
        offscreenContext.moveTo(point.x, point.y);
      } else {
        offscreenContext.lineTo(point.x, point.y);
      }
    });
    offscreenContext.closePath();
    offscreenContext.fill();

    const imageData = offscreenContext.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    );
    const binaryData = new Uint8Array(imageData.width * imageData.height);
    for (let i = 0; i < imageData.data.length; i += 4) {
      binaryData[i / 4] = imageData.data[i + 3] > 128 ? 1 : 0;
    }

    const contours = march(binaryData, imageData.width, imageData.height);
    setPoints(contours.map(([x, y]) => ({ x, y })));
  };

  const redrawImage = () => {
    if (!canvasRef.current || !image) return;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const img = imgRef.current;

    if (context && img) {
      const imgWidth = img.naturalWidth;
      const imgHeight = img.naturalHeight;

      // Calculate the scaling factor
      const scale = Math.min(
        canvas.width / imgWidth,
        canvas.height / imgHeight
      );
      scaleRef.current = scale;

      // Calculate the new dimensions and position
      const scaledWidth = imgWidth * scale;
      const scaledHeight = imgHeight * scale;
      const offsetX = (canvas.width - scaledWidth) / 2;
      const offsetY = (canvas.height - scaledHeight) / 2;
      offsetXRef.current = offsetX;
      offsetYRef.current = offsetY;

      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);

      if (rect) {
        context.strokeStyle = "blue";
        context.lineWidth = 2;
        context.strokeRect(rect.startX, rect.startY, rect.width, rect.height);

        // Draw the image inside the rectangle selection without zoom
        context.globalAlpha = 1; // Full opacity
        context.drawImage(
          img,
          (rect.startX - offsetX) / scale,
          (rect.startY - offsetY) / scale,
          rect.width / scale,
          rect.height / scale,
          rect.startX,
          rect.startY,
          rect.width,
          rect.height
        );
      }
    }
  };

  useEffect(() => {
    if (!canvasRef.current || !image) return;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const img = imgRef.current;

    if (context && img) {
      const imgWidth = img.naturalWidth;
      const imgHeight = img.naturalHeight;

      // Calculate the scaling factor
      const scale = Math.min(
        canvas.width / imgWidth,
        canvas.height / imgHeight
      );
      scaleRef.current = scale;

      // Calculate the new dimensions and position
      const scaledWidth = imgWidth * scale;
      const scaledHeight = imgHeight * scale;
      const offsetX = (canvas.width - scaledWidth) / 2;
      const offsetY = (canvas.height - scaledHeight) / 2;
      offsetXRef.current = offsetX;
      offsetYRef.current = offsetY;

      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);

      if (tool === "lasso") {
        context.strokeStyle = "red";
        context.lineWidth = 2;
        context.beginPath();
        points.forEach((point, index) => {
          if (index === 0) {
            context.moveTo(point.x, point.y);
          } else {
            context.lineTo(point.x, point.y);
          }
        });
        context.closePath();
        context.stroke();
      }

      if (rect) {
        context.fillStyle = "rgba(0, 0, 0, 0.5)";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.clearRect(rect.startX, rect.startY, rect.width, rect.height);

        context.strokeStyle = "blue";
        context.lineWidth = 2;
        context.strokeRect(rect.startX, rect.startY, rect.width, rect.height);

        // Draw the image inside the rectangle selection without zoom
        context.globalAlpha = 1; // Full opacity
        context.drawImage(
          img,
          (rect.startX - offsetX) / scale,
          (rect.startY - offsetY) / scale,
          rect.width / scale,
          rect.height / scale,
          rect.startX,
          rect.startY,
          rect.width,
          rect.height
        );
      }
    }
  }, [points, image, rect, tool]);

  const exportSelection = () => {
    if (!canvasRef.current || !imgRef.current) return;
    const canvas = canvasRef.current;
    const img = imgRef.current;
    const offscreenCanvas = document.createElement("canvas");
    const offscreenContext = offscreenCanvas.getContext("2d");
    if (!offscreenContext) return;

    const imgWidth = img.naturalWidth;
    const imgHeight = img.naturalHeight;

    // Calculate the scaling factor
    const scale = Math.min(canvas.width / imgWidth, canvas.height / imgHeight);

    if (tool === "lasso" && points.length >= 3) {
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
    } else if (tool === "square" && rect) {
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
      <div>
        {image && (
          <canvas
            ref={canvasRef}
            width={1200}
            height={1200}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            style={{ border: "1px solid black" }}
          />
        )}
        <img
          ref={imgRef}
          src={image as string}
          style={{ display: "none" }}
          alt="uploaded"
        />
      </div>
      <button onClick={exportSelection}>Export Selection</button>
    </div>
  );
};

export default LassoTool;
