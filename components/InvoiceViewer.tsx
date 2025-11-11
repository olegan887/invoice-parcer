import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { InvoiceItem, Vertex } from '../types';

interface InvoiceViewerProps {
  imageUrl: string;
  highlightedItem: InvoiceItem | null;
}

interface ImageRenderInfo {
    containerWidth: number;
    containerHeight: number;
    renderedWidth: number;
    renderedHeight: number;
    offsetX: number;
    offsetY: number;
}

const InvoiceViewer: React.FC<InvoiceViewerProps> = ({ imageUrl, highlightedItem }) => {
  const [renderInfo, setRenderInfo] = useState<ImageRenderInfo | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const calculateRenderInfo = useCallback(() => {
    if (imageRef.current && imageRef.current.complete && imageRef.current.naturalWidth > 0) {
        const img = imageRef.current;
        const containerWidth = img.offsetWidth;
        const containerHeight = img.offsetHeight;
        const imageNaturalWidth = img.naturalWidth;
        const imageNaturalHeight = img.naturalHeight;

        const containerRatio = containerWidth / containerHeight;
        const imageRatio = imageNaturalWidth / imageNaturalHeight;
        
        let renderedWidth, renderedHeight, offsetX, offsetY;

        // This logic correctly calculates the actual size and position of the image
        // within its element box, accounting for the effects of `object-contain`.
        if (containerRatio > imageRatio) {
            // Container is wider than the image's aspect ratio, leading to horizontal letterboxing.
            renderedHeight = containerHeight;
            renderedWidth = renderedHeight * imageRatio;
            offsetX = (containerWidth - renderedWidth) / 2;
            offsetY = 0;
        } else {
            // Container is taller than the image's aspect ratio, leading to vertical letterboxing.
            renderedWidth = containerWidth;
            renderedHeight = renderedWidth / imageRatio;
            offsetX = 0;
            offsetY = (containerHeight - renderedHeight) / 2;
        }

        setRenderInfo({
            containerWidth,
            containerHeight,
            renderedWidth,
            renderedHeight,
            offsetX,
            offsetY,
        });
    } else {
        setRenderInfo(null);
    }
  }, []);

  useEffect(() => {
    // Recalculate dimensions on window resize.
    window.addEventListener('resize', calculateRenderInfo);
    
    // Also calculate when the component mounts, in case the image is already cached and loaded.
    if (imageRef.current?.complete) {
        calculateRenderInfo();
    }
    
    return () => {
      window.removeEventListener('resize', calculateRenderInfo);
    };
  }, [calculateRenderInfo]);
  
  // Reset calculations when the image source changes.
  useEffect(() => {
    setRenderInfo(null);
  }, [imageUrl]);

  const getPolygonPoints = (vertices: Vertex[]): string => {
      if (!renderInfo) return '';
      const { renderedWidth, renderedHeight, offsetX, offsetY } = renderInfo;
      // Map normalized (0-1) coordinates to the absolute pixel coordinates of the rendered image.
      return vertices.map(v => 
        `${(v.x * renderedWidth) + offsetX},${(v.y * renderedHeight) + offsetY}`
      ).join(' ');
  }

  return (
    <div className="relative w-full">
      <img
        ref={imageRef}
        src={imageUrl}
        alt="Invoice"
        onLoad={calculateRenderInfo}
        className="w-full h-auto object-contain"
      />
      {highlightedItem && highlightedItem.boundingBox && renderInfo && (
        <svg 
            className="absolute top-0 left-0 pointer-events-none"
            width={renderInfo.containerWidth}
            height={renderInfo.containerHeight}
            viewBox={`0 0 ${renderInfo.containerWidth} ${renderInfo.containerHeight}`}
        >
            <polygon
                points={getPolygonPoints(highlightedItem.boundingBox)}
                className="fill-red-500/40 stroke-red-600 stroke-2"
            />
        </svg>
      )}
    </div>
  );
};

export default InvoiceViewer;
