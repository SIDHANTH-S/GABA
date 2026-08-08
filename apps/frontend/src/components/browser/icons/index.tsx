import svgPaths from "./paths";

/**
 * Icon set for the browser shell. Each icon is a self-sized SVG that inherits
 * layout from its wrapper. Geometry is preserved verbatim from the Figma import.
 */

export function ArcLogoIcon() {
  return (
    <div className="h-[11.947px] relative shrink-0 w-[14.705px]">
      <div className="absolute inset-[-1.26%_-1.02%]">
        <svg className="block size-full" fill="none" height="12.2475" preserveAspectRatio="none" viewBox="0 0 15.0045 12.2475" width="15.0045">
          <path d={svgPaths.p12213e00} fill="#2F2F2F" stroke="#2F2F2F" strokeWidth="0.3" />
        </svg>
      </div>
    </div>
  );
}

export function SidebarIcon() {
  return (
    <div className="h-[10px] relative shrink-0 w-[14px]">
      <svg className="absolute block inset-0 size-full" fill="none" height="10" preserveAspectRatio="none" viewBox="0 0 14 10" width="14">
        <path d={svgPaths.p69b4800} fill="#2F2F2F" />
      </svg>
    </div>
  );
}

export function DownloadsIcon() {
  return (
    <div className="h-[13.165px] relative shrink-0 w-[8.639px]">
      <div className="absolute inset-[0_-4.09%_-3.8%_-4.09%]">
        <svg className="block size-full" fill="none" height="13.6648" preserveAspectRatio="none" viewBox="0 0 9.34655 13.6648" width="9.34655">
          <path d={svgPaths.p3a4dbee0} stroke="#2F2F2F" />
        </svg>
      </div>
    </div>
  );
}

export function BackIcon() {
  return (
    <div className="h-[10.422px] relative shrink-0 w-[11.245px]">
      <div className="absolute inset-[-3.39%_0_-3.39%_-6.29%]">
        <svg className="block size-full" fill="none" height="11.1292" preserveAspectRatio="none" viewBox="0 0 11.9521 11.1292" width="11.9521">
          <path d={svgPaths.p34aef140} stroke="#2F2F2F" />
        </svg>
      </div>
    </div>
  );
}

export function NextIcon() {
  return (
    <div className="h-[10.422px] relative shrink-0 w-[11.245px]">
      <div className="absolute inset-[-3.39%_-6.29%_-3.39%_0]">
        <svg className="block size-full" fill="none" height="11.1292" preserveAspectRatio="none" viewBox="0 0 11.9521 11.1292" width="11.9521">
          <path d={svgPaths.pc066d48} stroke="#2F2F2F" strokeOpacity="0.3" />
        </svg>
      </div>
    </div>
  );
}

export function RefreshIcon() {
  return (
    <div className="relative shrink-0 size-[10.42px]">
      <div className="absolute inset-[-4.8%]">
        <svg className="block size-full" fill="none" height="11.42" preserveAspectRatio="none" viewBox="0 0 11.42 11.42" width="11.42">
          <path d={svgPaths.p20aadc00} stroke="#2F2F2F" />
        </svg>
      </div>
    </div>
  );
}

export function CopyLinkIcon() {
  return (
    <div className="h-[6.561px] relative shrink-0 w-[12.378px]">
      <svg className="absolute block inset-0 size-full" fill="none" height="6.56067" preserveAspectRatio="none" viewBox="0 0 12.3779 6.56067" width="12.3779">
        <path d={svgPaths.p3af8f100} fill="#2F2F2F" />
      </svg>
    </div>
  );
}

export function SettingsIcon() {
  return (
    <div className="h-[9.787px] relative shrink-0 w-[11.618px]">
      <svg className="absolute block inset-0 size-full" fill="none" height="9.78711" preserveAspectRatio="none" viewBox="0 0 11.6182 9.78711" width="11.6182">
        <g>
          <mask fill="white" id="path-1-inside-1_0_28">
            <path d={svgPaths.p2b0e5a80} />
          </mask>
          <path d={svgPaths.p2b0e5a80} fill="#2F2F2F" />
          <path d={svgPaths.p3ebb8d80} fill="#2F2F2F" mask="url(#path-1-inside-1_0_28)" />
        </g>
      </svg>
    </div>
  );
}

export function SplitIcon() {
  return (
    <div className="relative shrink-0 size-[10px]">
      <svg className="absolute block inset-0 size-full" fill="none" height="10" preserveAspectRatio="none" viewBox="0 0 10 10" width="10">
        <rect height="9" rx="1.5" stroke="#2F2F2F" width="9" x="0.5" y="0.5" />
        <path d="M5 0V10" stroke="#2F2F2F" />
      </svg>
    </div>
  );
}

export function MinimizeIcon() {
  return (
    <div className="relative shrink-0 size-[10px]">
      <svg className="absolute block inset-0 size-full" fill="none" height="10" preserveAspectRatio="none" viewBox="0 0 10 10" width="10">
        <path d="M0 5H10" stroke="#2F2F2F" />
      </svg>
    </div>
  );
}

export function MaximizeIcon() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0">
      <div className="relative rounded-[1px] shrink-0 size-[10px]">
        <div aria-hidden className="absolute border border-[#2f2f2f] border-solid inset-0 pointer-events-none rounded-[1px]" />
      </div>
    </div>
  );
}

export function CloseIcon() {
  return (
    <div className="relative shrink-0 size-[9.798px]">
      <svg className="absolute block inset-0 size-full" fill="none" height="9.79785" preserveAspectRatio="none" viewBox="0 0 9.79785 9.79785" width="9.79785">
        <path d={svgPaths.p29c5d600} fill="#2F2F2F" />
      </svg>
    </div>
  );
}

/** Circular gradient send button used in the prompt composer. */
export function SendActionIcon() {
  return (
    <div className="relative shrink-0 size-[24px]">
      <svg className="absolute block inset-0 size-full" fill="none" height="24" preserveAspectRatio="none" viewBox="0 0 24 24" width="24">
        <g filter="url(#filter0_i_0_6)">
          <rect fill="#0072ED" height="24" rx="12" width="24" />
          <path clipRule="evenodd" d={svgPaths.p3b6f0980} fill="white" fillRule="evenodd" />
        </g>
        <defs>
          <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="27.9184" id="filter0_i_0_6" width="26.6122" x="0" y="0">
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
            <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
            <feOffset dx="2.61224" dy="3.91837" />
            <feGaussianBlur stdDeviation="3.52653" />
            <feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" />
            <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.4 0" />
            <feBlend in2="shape" mode="normal" result="effect1_innerShadow_0_6" />
          </filter>
        </defs>
      </svg>
    </div>
  );
}

/** Glowing sparkle mark that anchors the composer input. */
export function SparkleGlowIcon() {
  return (
    <div className="relative shrink-0 size-[24px]">
      <div className="absolute contents left-px top-[1.58px]">
        <div className="absolute left-px size-[24px] top-[1.58px]">
          <div className="absolute inset-[-41.67%]">
            <svg className="block size-full" fill="none" height="44" preserveAspectRatio="none" viewBox="0 0 44 44" width="44">
              <g filter="url(#filter0_f_0_40)" opacity="0.35">
                <circle cx="22" cy="22" fill="url(#paint0_linear_0_40)" r="12" />
              </g>
              <defs>
                <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="44" id="filter0_f_0_40" width="44" x="0" y="0">
                  <feFlood floodOpacity="0" result="BackgroundImageFix" />
                  <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
                  <feGaussianBlur result="effect1_foregroundBlur_0_40" stdDeviation="5" />
                </filter>
                <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_0_40" x1="22" x2="22" y1="10" y2="34">
                  <stop stopColor="#0A84FF" />
                  <stop offset="0.0001" stopColor="#0978E7" />
                  <stop offset="1" stopColor="#064F99" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
        <p
          className="[word-break:break-word] absolute bg-clip-text font-normal leading-[normal] left-[6px] text-[16px] text-[transparent] top-[4px] whitespace-nowrap"
          style={{ fontVariationSettings: '"wdth" 100', backgroundImage: "linear-gradient(237.2647755253105deg, rgb(10, 132, 255) 11.238%, rgb(6, 79, 153) 86.714%)" }}
        >
          ✦
        </p>
      </div>
    </div>
  );
}

/** Small benefit glyphs rendered beneath the composer. */
export function DocumentGlyph() {
  return (
    <div className="overflow-clip relative shrink-0 size-[8.296px]">
      <div className="absolute inset-[11.46%_18.75%]">
        <div className="absolute inset-[-5.41%_-6.66%_-5.41%_-6.67%]">
          <svg className="block size-full" fill="none" height="7.08622" preserveAspectRatio="none" viewBox="0 0 5.87638 7.08622" width="5.87638">
            <path d={svgPaths.p2f050280} stroke="#125E07" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.691339" />
            <path d={svgPaths.p10a72b40} stroke="#125E07" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.691339" />
          </svg>
        </div>
      </div>
    </div>
  );
}

export function MoneyGlyph() {
  return (
    <div className="overflow-clip relative shrink-0 size-[8.296px]">
      <div className="absolute inset-[16.67%_8.34%_16.67%_8.32%]">
        <div className="absolute inset-[-6.25%_-5%]">
          <svg className="block size-full" fill="none" height="6.222" preserveAspectRatio="none" viewBox="0 0 7.60472 6.222" width="7.60472">
            <path d={svgPaths.p2c703800} stroke="#125E07" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.691339" />
            <path d={svgPaths.p1e09e440} stroke="#125E07" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.691339" />
            <path d={svgPaths.pea8e900} stroke="#125E07" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.691339" />
          </svg>
        </div>
      </div>
    </div>
  );
}

export function RefundGlyph() {
  return (
    <div className="relative shrink-0 size-[8.296px]">
      <svg className="absolute block inset-0 size-full" fill="none" height="8.29606" preserveAspectRatio="none" viewBox="0 0 8.29606 8.29606" width="8.29606">
        <path d={svgPaths.p1d5f1000} fill="#125E07" />
      </svg>
    </div>
  );
}

export function SupportGlyph() {
  return (
    <div className="relative shrink-0 size-[8.296px]">
      <svg className="absolute block inset-0 size-full" fill="none" height="8.29606" preserveAspectRatio="none" viewBox="0 0 8.29606 8.29606" width="8.29606">
        <path d={svgPaths.pf80bb80} fill="#125E07" />
      </svg>
    </div>
  );
}
