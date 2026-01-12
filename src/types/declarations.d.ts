declare module 'react-simple-maps' {
  import * as React from 'react';

  export interface ComposableMapProps {
    width?: number;
    height?: number;
    projection?: string | Function;
    projectionConfig?: object;
    className?: string;
    style?: object;
    children?: React.ReactNode;
  }

  export const ComposableMap: React.FC<ComposableMapProps>;
  export const ZoomableGroup: React.FC<any>;
  export const Geographies: React.FC<any>;
  export const Geography: React.FC<any>;
  export const Marker: React.FC<any>;
  export const Line: React.FC<any>;
  export const Annotation: React.FC<any>;
}

declare module 'd3-scale' {
  export function scaleSqrt(): any;
  export function scaleLinear(): any;
}
