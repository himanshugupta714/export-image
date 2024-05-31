import { useState, useRef, useEffect } from "react";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import { march } from "marching-squares";

import { ToolBox } from "../components/Tools/enum";

export const useDrawing = (
  tool: ToolBox,
  image: string | ArrayBuffer | null
) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
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

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const { offsetX, offsetY } = event.nativeEvent;

    if (tool === ToolBox.SQUARE) {
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

    if (isDrawing && tool === ToolBox.LASSO) {
      setPoints((prevPoints) => [...prevPoints, { x: offsetX, y: offsetY }]);
    } else if (rect && tool === ToolBox.SQUARE) {
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
    if (tool === ToolBox.LASSO) {
      setIsDrawing(false);
      smoothPoints();
    } else if (tool === ToolBox.SQUARE) {
      setIsDrawing(false);
      setIsResizing(false);
      redrawImage(); // Redraw the original image without grey overlay
    }
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

    const contours: [number, number][] = march(
      binaryData,
      imageData.width,
      imageData.height
    );

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

      if (tool === ToolBox.LASSO) {
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

  return {
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
  };
};
