import { useId } from 'react';
import './horizon.css';

/** Original, still vector atmosphere. Independent of the graph's camera and physics. */
export default function HorizonBackground() {
  const id = useId().replace(/:/g, '');
  const ref = (name: string) => `url(#${id}-${name})`;
  return <svg className="horizon-background" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={`${id}-sky`} x2="0" y2="1">
        <stop stopColor="var(--horizon-sky-top)"/>
        <stop offset="1" stopColor="var(--horizon-sky-bottom)"/>
      </linearGradient>
      <radialGradient id={`${id}-air`}>
        <stop stopColor="var(--horizon-cool)" stopOpacity=".3"/>
        <stop offset=".5" stopColor="var(--horizon-cool)" stopOpacity=".13"/>
        <stop offset="1" stopColor="var(--horizon-cool)" stopOpacity="0"/>
      </radialGradient>
      <radialGradient id={`${id}-dawn`}>
        <stop stopColor="var(--horizon-sun)" stopOpacity=".78"/>
        <stop offset=".18" stopColor="var(--horizon-warm)" stopOpacity=".45"/>
        <stop offset=".55" stopColor="var(--horizon-warm)" stopOpacity=".12"/>
        <stop offset="1" stopColor="var(--horizon-warm)" stopOpacity="0"/>
      </radialGradient>
      <linearGradient id={`${id}-surface`} x2="0" y2="1">
        <stop stopColor="var(--horizon-surface-top)"/>
        <stop offset="1" stopColor="var(--horizon-surface-bottom)"/>
      </linearGradient>
      <linearGradient id={`${id}-rim`}>
        <stop stopColor="var(--horizon-cool)" stopOpacity="0"/>
        <stop offset=".28" stopColor="var(--horizon-cool)" stopOpacity=".35"/>
        <stop offset=".64" stopColor="var(--horizon-sun)" stopOpacity=".85"/>
        <stop offset=".83" stopColor="var(--horizon-warm)" stopOpacity=".4"/>
        <stop offset="1" stopColor="var(--horizon-warm)" stopOpacity="0"/>
      </linearGradient>
      <filter id={`${id}-soft`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="13"/></filter>
    </defs>
    <path fill={ref('sky')} d="M0 0H1600V1000H0Z"/>
    <ellipse cx="800" cy="720" rx="1050" ry="410" fill={ref('air')}/>
    <ellipse cx="1040" cy="706" rx="500" ry="230" fill={ref('dawn')}/>
    <ellipse cx="800" cy="1590" rx="1600" ry="890" fill="none" stroke={ref('rim')} strokeWidth="22" filter={ref('soft')}/>
    <ellipse cx="800" cy="1590" rx="1600" ry="890" fill={ref('surface')} stroke={ref('rim')} strokeWidth="1.4"/>
  </svg>;
}
