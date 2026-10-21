import type { CSSProperties, ReactNode } from 'react';
interface GlassSurfaceProps {
 children?: ReactNode; width?: string | number; height?: string | number; borderRadius?: number;
 distortionScale?: number; displace?: number; backgroundOpacity?: number; blur?: number; saturation?: number;
 className?: string; style?: CSSProperties; refraction?: boolean; renderer?: string;
}
export default function GlassSurface(props: GlassSurfaceProps): ReactNode;
