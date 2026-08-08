import svgPaths from "./start-paths";

/** GABA spark mark shown at the left of the start-page search bar. */
export function SparkSpiritIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={"block " + className} fill="none" preserveAspectRatio="none" viewBox="0 0 25.8666 25.8666">
      <path d={svgPaths.pdd7b9c0} fill="#0072ED" />
    </svg>
  );
}

/** Circular gradient submit button with an inner shadow and arrow glyph. */
export function SearchSubmitIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={"block " + className} fill="none" preserveAspectRatio="none" viewBox="0 0 38.8 38.8">
      <g filter="url(#filter0_i_start)">
        <rect fill="#0072ED" height="38.8" rx="19.4" width="38.8" />
        <path clipRule="evenodd" d={svgPaths.pd934500} fill="white" fillRule="evenodd" />
      </g>
      <defs>
        <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="45.1346" id="filter0_i_start" width="43.0231" x="0" y="0">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
          <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
          <feOffset dx="4.22312" dy="6.33469" />
          <feGaussianBlur stdDeviation="5.70122" />
          <feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" />
          <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.4 0" />
          <feBlend in2="shape" mode="normal" result="effect1_innerShadow_start" />
        </filter>
      </defs>
    </svg>
  );
}
