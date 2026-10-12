import { clamp, interpolate, lerp } from "@/simulation/helpers/helpers";
import {
  MouseEvent,
  WheelEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

interface Props extends React.ComponentPropsWithoutRef<"canvas"> {
  data: any[];
  getter: (point: any) => [number, number];
  resolution?: number;
  margins?: { top: number; bottom: number; left: number; right: number };
  preSmooth?: boolean;
  preSmoothSamples?: number;
  preSmoothRadius?: number;
  postSmooth?: boolean;
  postSmoothness?: number;
  updateKey?: any;
  drawLinesToCursor?: boolean;
  xLabelFormatter?: (value: number) => string;
  yLabelFormatter?: (value: number) => string;
}

export default function LinearGraph({
  data,
  getter,
  resolution = 1,
  margins = { top: 20, bottom: 40, left: 20, right: 40 },
  preSmooth = true,
  preSmoothSamples = 10,
  preSmoothRadius = 1,
  postSmooth = false,
  postSmoothness = 1,
  updateKey,
  drawLinesToCursor = true,
  xLabelFormatter = (value) => value.toString(),
  yLabelFormatter = (value) => value.toString(),
  ...rest
}: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);

  // the canvas size is state, so the graph redraws when it changes
  const [canvasSize, setCanvasSize] = useState({ width: 100, height: 100 });
  const canvasWidth = canvasSize.width;
  const canvasHeight = canvasSize.height;

  const absoluteGraphWidth = canvasWidth - margins.left - margins.right;
  const absoluteGraphHeight = canvasHeight - margins.top - margins.bottom;

  // Mouse
  const [isMouseInsideGraph, setIsMouseInsideGraph] = useState(false);
  const [isMouseInsideCanvas, setIsMouseInsideCanvas] = useState(false);
  const [relativeMouseX, setRelativeMouseX] = useState(0);
  const [relativeMouseY, setRelativeMouseY] = useState(0);

  // Zoom
  const [zoomLevel, setZoomLevel] = useState(1);
  const [zoomViewportLeft, setZoomViewportLeft] = useState(0);
  const [zoomViewportWidth, setZoomViewportWidth] = useState(1);

  // Panning
  const [mouseLastX, setMouseLastX] = useState(0);

  // Calculations for zoom: keep the point under the mouse in place, then pan
  const updateViewport = (
    newZoomLevel: number,
    mouseNormalized: number,
    mouseMovementX: number
  ) => {
    const newViewportWidth = 1 / newZoomLevel;
    let newViewportLeft =
      zoomViewportLeft + mouseNormalized * (zoomViewportWidth - newViewportWidth);

    // Add mouse movement
    newViewportLeft -= (mouseMovementX / absoluteGraphWidth) * newViewportWidth;

    // Clamp values because of loss of precision on the results
    newViewportLeft = clamp(newViewportLeft, 0, 1 - newViewportWidth);

    // Set new values for viewport
    setZoomViewportLeft(newViewportLeft);
    setZoomViewportWidth(newViewportWidth);
  };

  const getInterpolatedPointAt = useCallback(
    (points: any[], index: number, useGetter = true): [number, number] => {
      // Position can be greater than (points.length - 1) (because of float
      // precision) for a extremely tiny value, for example (0.000000000002)
      // so let's clamp the value
      index = clamp(index, 0, points.length - 1);

      // Get the point to the left and to the right on the
      // original array by rounding the variable above
      const leftIndex = Math.floor(index);
      const rightIndex = Math.ceil(index);

      // This value (between 0 and 1) is used to interpolate
      // the left and right points
      const atPoint = index - leftIndex;

      // Get left and right points
      const leftPoint = useGetter
        ? getter(points[leftIndex])
        : points[leftIndex];
      const rightPoint = useGetter
        ? getter(points[rightIndex])
        : points[rightIndex];

      // Interpolate the points
      const interpolatedX = lerp(leftPoint[0], rightPoint[0], atPoint);
      const interpolatedY = lerp(leftPoint[1], rightPoint[1], atPoint);
      return [interpolatedX, interpolatedY];
    },
    [getter]
  );

  const getFilteredData = useCallback(
    (
      points: number[]
    ): {
      points: [number, number][];
      minX: number;
      maxX: number;
      minY: number;
      maxY: number;
    } => {
      // Calculate the new size of array
      const sampleSize = Math.floor(absoluteGraphWidth / resolution);
      const resizeFactor = (points.length - 1) / (sampleSize - 1);

      // Create new array
      const sampledPoints: [number, number][] = [];
      const offset = zoomViewportLeft * (points.length - 1);

      // Sample the points for the new filtered data
      for (let sampleIndex = 0; sampleIndex < sampleSize; sampleIndex++) {
        // This decimal value represents where this index
        // would lay on the original array
        const originalIndex =
          offset + sampleIndex * resizeFactor * zoomViewportWidth;

        // Set the data
        let finalValue = getInterpolatedPointAt(points, originalIndex);

        if (preSmooth) {
          // Apply median filter
          const count = preSmoothSamples * 2 + 1;
          const leftIndex =
            offset + (sampleIndex - 1) * resizeFactor * zoomViewportWidth;
          const rightIndex =
            offset + (sampleIndex + 1) * resizeFactor * zoomViewportWidth;
          const minInterpolant = 0.5 - preSmoothRadius / 2;
          const maxInterpolant = 0.5 + preSmoothRadius / 2;

          let sum = 0;
          for (let j = -preSmoothSamples; j <= preSmoothSamples; j++) {
            const interpolant = interpolate(
              j,
              -preSmoothSamples,
              preSmoothSamples,
              minInterpolant,
              maxInterpolant
            );
            const medianIndex = lerp(leftIndex, rightIndex, interpolant);
            sum += getInterpolatedPointAt(points, medianIndex)[1];
          }

          finalValue[1] = sum / count;
        }

        // Set new value
        sampledPoints[sampleIndex] = finalValue;
      }

      const finalPoints: [number, number][] = [];

      // Record min and max values
      let minX = Number.MAX_VALUE;
      let maxX = Number.MIN_VALUE;
      let minY = Number.MAX_VALUE;
      let maxY = Number.MIN_VALUE;

      // Apply mean filter
      for (let index = 0; index < sampledPoints.length; index++) {
        const graphPoint = sampledPoints[index];
        let finalValue: [number, number] = [graphPoint[0], graphPoint[1]];

        if (postSmooth) {
          // Apply median filter
          let count = 0;
          let sum = 0;
          for (
            let j = Math.max(0, index - postSmoothness);
            j < Math.min(sampledPoints.length - 1, index + postSmoothness);
            j++
          ) {
            sum += sampledPoints[j][1];
            count++;
          }

          finalValue[1] = sum / count;
        }

        // Set new value
        finalPoints[index] = finalValue;

        // Find min and max X values
        if (finalValue[0] < minX) {
          minX = finalValue[0];
        } else if (finalValue[0] > maxX) {
          maxX = finalValue[0];
        }

        // Find min and max Y values
        if (finalValue[1] < minY) {
          minY = finalValue[1];
        } else if (finalValue[1] > maxY) {
          maxY = finalValue[1];
        }
      }

      return { points: finalPoints, minX, maxX, minY, maxY };
    },
    [
      absoluteGraphWidth,
      resolution,
      zoomViewportLeft,
      preSmooth,
      zoomViewportWidth,
      preSmoothRadius,
      preSmoothSamples,
      getInterpolatedPointAt,
      postSmooth,
      postSmoothness,
    ]
  );

  // Function to get coordinates of point
  const pointToCanvasPoint = useCallback(
    (
      filteredData: ReturnType<typeof getFilteredData>,
      x: number,
      y: number
    ): [number, number] => {
      const interpolatedX = interpolate(
        x,
        filteredData.minX,
        filteredData.maxX,
        margins.left,
        canvasWidth - margins.right
      );

      const interpolatedY = interpolate(
        y,
        filteredData.minY,
        filteredData.maxY,
        canvasHeight - margins.bottom,
        margins.top
      );

      return [interpolatedX, interpolatedY];
    },
    [
      canvasHeight,
      canvasWidth,
      margins.bottom,
      margins.left,
      margins.right,
      margins.top,
    ]
  );

  const drawGraph = useCallback(
    (canvas: HTMLCanvasElement) => {
      if (!canvas) return;
      const context = canvas.getContext("2d") as CanvasRenderingContext2D;

      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      canvas.width = width;
      canvas.height = height;

      // Draw X axis
      context.strokeStyle = "red";
      context.beginPath();
      const y = height - margins.bottom;
      context.moveTo(margins.left, y);
      context.lineTo(width - margins.right, y);
      context.stroke();

      // Draw Y axis
      context.strokeStyle = "green";
      context.beginPath();
      const x = width - margins.right;
      context.moveTo(x, margins.top);
      context.lineTo(x, height - margins.bottom);
      context.stroke();

      if (data.length > 1) {
        const textSize = 12;
        context.lineWidth = 2;
        context.strokeStyle = "blue";

        // Get the points to render
        const filteredData = getFilteredData(data);
        const { points, minY, maxY } = filteredData;

        // Begin path
        context.beginPath();

        // Start path at the first point
        const firstGraphPoint = points[0];
        let canvasPoint = pointToCanvasPoint(
          filteredData,
          firstGraphPoint[0],
          firstGraphPoint[1]
        );
        context.moveTo(canvasPoint[0], canvasPoint[1]);

        for (let pointIndex = 1; pointIndex < points.length; pointIndex++) {
          const graphPoint = points[pointIndex];
          // Draw line to the next point
          canvasPoint = pointToCanvasPoint(
            filteredData,
            graphPoint[0],
            graphPoint[1]
          );
          context.lineTo(canvasPoint[0], canvasPoint[1]);
        }

        // Draw the path
        context.stroke();

        if (isMouseInsideCanvas && drawLinesToCursor) {
          const clampedMouseX = clamp(
            relativeMouseX,
            margins.left,
            canvasWidth - margins.right
          );

          // Find the coordinates on the graph at the cursor
          const normalizedCursorX =
            (relativeMouseX - margins.left) / absoluteGraphWidth;
          const targetIndex = normalizedCursorX * (points.length - 1);
          const [x, y] = getInterpolatedPointAt(points, targetIndex, false);
          const intersectionY =
            margins.top + interpolate(y, minY, maxY, absoluteGraphHeight, 0);

          // Draw X line to cursor intersection
          context.strokeStyle = "rgba(0,0,255,0.2)";
          context.beginPath();
          context.moveTo(clampedMouseX, intersectionY);
          context.lineTo(width - margins.right, intersectionY);
          context.stroke();

          // Draw Y line to cursor intersection
          context.beginPath();
          context.moveTo(clampedMouseX, intersectionY);
          context.lineTo(clampedMouseX, height - margins.bottom);
          context.stroke();

          // Get the labels to render
          const xText = xLabelFormatter(x);
          const yText = yLabelFormatter(y);

          // Print the x label
          context.font = "bold 12px arial";
          context.textAlign = "center";
          context.fillText(
            xText,
            clampedMouseX,
            height - margins.bottom + textSize * 2
          );

          // Print the Y label
          context.textAlign = "left";
          context.fillText(
            yText,
            width - margins.right + textSize / 2,
            intersectionY
          );
        }
      }

      // Draw zoom viewport
      // const left =
      //   margins.left + this.zoomViewportLeft * this.absoluteGraphWidth;
      // const right = left + this.zoomViewportWidth * this.absoluteGraphWidth;
      // context.beginPath();
      // context.moveTo(left, 0);
      // context.lineTo(left, height);
      // context.stroke();
      // context.beginPath();
      // context.moveTo(right, 0);
      // context.lineTo(right, height);
      // context.stroke();
    },
    [
      absoluteGraphHeight,
      absoluteGraphWidth,
      canvasWidth,
      data,
      drawLinesToCursor,
      getFilteredData,
      getInterpolatedPointAt,
      isMouseInsideCanvas,
      margins.bottom,
      margins.left,
      margins.right,
      margins.top,
      pointToCanvasPoint,
      relativeMouseX,
      xLabelFormatter,
      yLabelFormatter,
    ]
  );

  const handleWheel = (e: WheelEvent) => {
    if (isMouseInsideGraph) {
      // Calculate normalized position
      const mouseNormalized = interpolate(
        relativeMouseX,
        margins.left,
        canvasWidth - margins.right,
        0,
        1
      );

      // Calculate new zoom
      let newZoom = zoomLevel;
      if (e.deltaY > 0) {
        newZoom /= 1.1;
      } else {
        newZoom *= 1.05;
      }
      newZoom = clamp(newZoom, 1, 1000);
      setZoomLevel(newZoom);
      updateViewport(newZoom, mouseNormalized, 0);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (canvas.current) {
      const canvasRect = canvas.current.getBoundingClientRect();

      // Calculate the mouse position relative to the canvas
      const newRelativeMouseX = e.clientX - canvasRect.left;
      const newRelativeMouseY = e.clientY - canvasRect.top;

      // Check if the mouse is inside the graph
      const newIsMouseInsideGraph =
        newRelativeMouseX >= margins.left &&
        newRelativeMouseX <= canvas.current.width - margins.right &&
        newRelativeMouseY >= margins.top &&
        newRelativeMouseY <= canvas.current.height - margins.bottom;

      // Calculate the horizontal speed of the mouse when the user is clicking
      if (e.buttons === 1 && newIsMouseInsideGraph) {
        if (mouseLastX) {
          updateViewport(zoomLevel, 0, e.clientX - mouseLastX);
        }
        setMouseLastX(e.clientX);
      } else {
        setMouseLastX(0);
      }

      setRelativeMouseX(newRelativeMouseX);
      setRelativeMouseY(newRelativeMouseY);
      setIsMouseInsideGraph(newIsMouseInsideGraph);
      setIsMouseInsideCanvas(true);
    }
  };

  const handleMouseLeave = () => {
    setIsMouseInsideGraph(false);
    setIsMouseInsideCanvas(false);
    setMouseLastX(0);
  };

  // Prevent scrolling the page through the canvas
  useEffect(() => {
    if (canvas.current) {
      canvas.current.addEventListener("wheel", (e) => e.preventDefault());
    }
  }, []);

  // Track the canvas size, so the graph redraws when it is resized
  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const observer = new ResizeObserver(() => {
      setCanvasSize((size) =>
        size.width === element.clientWidth && size.height === element.clientHeight
          ? size
          : { width: element.clientWidth, height: element.clientHeight }
      );
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (canvas.current) drawGraph(canvas.current);
  }, [drawGraph, updateKey]);

  return (
    <canvas
      ref={canvas}
      {...rest}
      onWheel={handleWheel}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    ></canvas>
  );
}
