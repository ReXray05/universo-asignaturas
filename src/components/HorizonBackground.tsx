import { useId } from 'react';
import './horizon.css';

// An original SVG interpretation of the owner's visual reference, not the licensed shader.
// Drift stays still at rest; the atmosphere follows the existing event-driven parallax.
const direction = { horizon: .79, curvature: 4.04, tilt: -90, sunPosition: .46,
  spread: .41, atmosphere: 1.6, thickness: 2.44, rim: 1.16, flare: 1.95,
  airglow: .39, clouds: 2, stars: 1.73, aurora: 1.28, bloom: 1.03, grain: .21 };
const stars = Array.from({ length: Math.round(44 * direction.stars) }, (_, i) => ({
  x: ((i * 6271 + 139) % 1583), y: ((i * 3547 + 73) % 991),
  r: i % 9 === 0 ? 1.1 : .55, opacity: .15 + (i % 5) * .065,
}));

export default function HorizonBackground() {
  const id = useId().replace(/:/g, '');
  const ref = (name: string) => `url(#${id}-${name})`;
  const radius = 3200 / direction.curvature;
  const edge = 1600 * direction.horizon;
  const center = edge + radius;
  const sunY = 500 - direction.sunPosition * 500;
  const sunX = center - radius * Math.sqrt(1 - ((sunY - 500) / 880) ** 2);
  return <svg className="horizon-background" viewBox="0 0 1600 1000" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={`${id}-sky`} x2="1" y2=".3">
        <stop stopColor="var(--horizon-sky-top)"/>
        <stop offset="1" stopColor="var(--horizon-sky-bottom)"/>
      </linearGradient>
      <radialGradient id={`${id}-air`}>
        <stop stopColor="var(--horizon-cool)" stopOpacity=".46"/>
        <stop offset=".48" stopColor="var(--horizon-cool)" stopOpacity=".2"/>
        <stop offset="1" stopColor="var(--horizon-cool)" stopOpacity="0"/>
      </radialGradient>
      <radialGradient id={`${id}-dawn`}>
        <stop stopColor="var(--horizon-sun)" stopOpacity=".95"/>
        <stop offset=".12" stopColor="var(--horizon-warm)" stopOpacity=".8"/>
        <stop offset=".42" stopColor="var(--horizon-warm)" stopOpacity=".31"/>
        <stop offset="1" stopColor="var(--horizon-warm)" stopOpacity="0"/>
      </radialGradient>
      <radialGradient id={`${id}-surface`} cx="0" cy=".26" r="1">
        <stop stopColor="var(--horizon-surface-top)"/>
        <stop offset=".65" stopColor="var(--horizon-surface-bottom)"/>
      </radialGradient>
      <linearGradient id={`${id}-rim`} x1="0" y1="1" x2=".15" y2="0">
        <stop stopColor="var(--horizon-cool)" stopOpacity=".15"/>
        <stop offset=".36" stopColor="var(--horizon-cool)" stopOpacity=".8"/>
        <stop offset=".67" stopColor="var(--horizon-warm)"/>
        <stop offset=".79" stopColor="var(--horizon-sun)"/>
        <stop offset="1" stopColor="var(--horizon-warm)" stopOpacity=".1"/>
      </linearGradient>
      <linearGradient id={`${id}-rays`} x2="1" y2=".2">
        <stop stopColor="var(--horizon-cool)" stopOpacity="0"/>
        <stop offset=".7" stopColor="var(--horizon-cool)" stopOpacity=".16"/>
        <stop offset="1" stopColor="var(--horizon-warm)" stopOpacity=".1"/>
      </linearGradient>
      <filter id={`${id}-soft`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={12 * direction.thickness}/></filter>
      <filter id={`${id}-cloud`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="20"/></filter>
      <filter id={`${id}-grain`}><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="17" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
    </defs>
    <path fill={ref('sky')} d="M0 0H1600V1000H0Z"/>
    <g className="horizon-stars" fill="var(--horizon-star)">{stars.map((star, i) => <circle key={i} cx={star.x} cy={star.y} r={star.r} opacity={star.opacity}/>)}</g>
    <g className="horizon-atmosphere">
      <ellipse cx={edge + 180} cy="510" rx="680" ry="840" fill={ref('air')} opacity={direction.atmosphere / 1.6}/>
      <path d="M1460 60Q1010 190 1010 650Q1040 860 1410 1020L1600 1000V0Z" fill={ref('rays')} filter={ref('cloud')} opacity={direction.aurora / 1.28}/>
      <ellipse cx={sunX} cy={sunY} rx={760 * direction.spread} ry="310" fill={ref('dawn')}/>
      <ellipse cx={center} cy="500" rx={radius} ry="880" fill="none" stroke={ref('rim')} strokeWidth={32 * direction.bloom} filter={ref('soft')}/>
      <ellipse cx={center + 14} cy="500" rx={radius + 70} ry="932" fill="none" stroke={ref('rim')} strokeWidth="2" opacity={direction.airglow} filter={ref('cloud')}/>
      <ellipse cx={center} cy="500" rx={radius} ry="880" fill={ref('surface')} stroke={ref('rim')} strokeWidth={direction.rim * 1.3}/>
      <path d={`M${sunX + 5} ${sunY - 150}q50 90 12 170t35 190`} fill="none" stroke="var(--horizon-warm)" strokeWidth="16" opacity={direction.clouds * .055} filter={ref('cloud')}/>
      <ellipse cx={sunX - 3} cy={sunY} rx="13" ry="72" fill={ref('dawn')} opacity={direction.flare / 1.95}/>
    </g>
    <path className="horizon-grain" d="M0 0H1600V1000H0Z" filter={ref('grain')} opacity={direction.grain * .14}/>
  </svg>;
}
