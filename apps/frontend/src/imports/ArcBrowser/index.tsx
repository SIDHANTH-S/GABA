import svgPaths from "./svg-geggqmixba";
import imgHeroText from "./3f5df039ba38d89a43aaa2de970f832cb08c91d0.png";

function ArcLogo() {
  return (
    <div className="h-[11.947px] relative shrink-0 w-[14.705px]" data-name="arc-logo">
      <div className="absolute inset-[-1.26%_-1.02%]">
        <svg className="block size-full" fill="none" height="12.2475" preserveAspectRatio="none" viewBox="0 0 15.0045 12.2475" width="15.0045">
          <g id="arc-logo">
            <path d={svgPaths.p12213e00} fill="#2F2F2F" id="path1166" stroke="#2F2F2F" strokeWidth="0.3" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Sidebar() {
  return (
    <div className="h-[10px] relative shrink-0 w-[14px]" data-name="sidebar">
      <svg className="absolute block inset-0 size-full" fill="none" height="10" preserveAspectRatio="none" viewBox="0 0 14 10" width="14">
        <g id="sidebar">
          <path d={svgPaths.p69b4800} fill="#2F2F2F" id="Union" />
        </g>
      </svg>
    </div>
  );
}

function Downloads() {
  return (
    <div className="h-[13.165px] relative shrink-0 w-[8.639px]" data-name="downloads">
      <div className="absolute inset-[0_-4.09%_-3.8%_-4.09%]">
        <svg className="block size-full" fill="none" height="13.6648" preserveAspectRatio="none" viewBox="0 0 9.34655 13.6648" width="9.34655">
          <g id="downloads">
            <path d={svgPaths.p3a4dbee0} id="Vector 5" stroke="#2F2F2F" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Frame() {
  return (
    <div className="content-stretch flex gap-[20px] items-center justify-center relative shrink-0">
      <ArcLogo />
      <Sidebar />
      <Downloads />
    </div>
  );
}

function Back() {
  return (
    <div className="h-[10.422px] relative shrink-0 w-[11.245px]" data-name="back">
      <div className="absolute inset-[-3.39%_0_-3.39%_-6.29%]">
        <svg className="block size-full" fill="none" height="11.1292" preserveAspectRatio="none" viewBox="0 0 11.9521 11.1292" width="11.9521">
          <g id="back">
            <path d={svgPaths.p34aef140} id="Vector 6" stroke="#2F2F2F" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Next() {
  return (
    <div className="h-[10.422px] relative shrink-0 w-[11.245px]" data-name="next">
      <div className="absolute inset-[-3.39%_-6.29%_-3.39%_0]">
        <svg className="block size-full" fill="none" height="11.1292" preserveAspectRatio="none" viewBox="0 0 11.9521 11.1292" width="11.9521">
          <g id="next">
            <path d={svgPaths.pc066d48} id="Vector 7" stroke="#2F2F2F" strokeOpacity="0.3" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Refresh() {
  return (
    <div className="relative shrink-0 size-[10.42px]" data-name="refresh">
      <div className="absolute inset-[-4.8%]">
        <svg className="block size-full" fill="none" height="11.42" preserveAspectRatio="none" viewBox="0 0 11.42 11.42" width="11.42">
          <g id="refresh">
            <path d={svgPaths.p20aadc00} id="Ellipse 1" stroke="#2F2F2F" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Frame1() {
  return (
    <div className="content-stretch flex gap-[20px] items-center justify-center relative shrink-0">
      <Back />
      <Next />
      <Refresh />
    </div>
  );
}

function LeftIcons() {
  return (
    <div className="content-stretch flex gap-[121px] items-center justify-center relative shrink-0" data-name="left-icons">
      <Frame />
      <Frame1 />
    </div>
  );
}

function CopyLink() {
  return (
    <div className="h-[6.561px] relative shrink-0 w-[12.378px]" data-name="copy link">
      <svg className="absolute block inset-0 size-full" fill="none" height="6.56067" preserveAspectRatio="none" viewBox="0 0 12.3779 6.56067" width="12.3779">
        <g id="copy link">
          <path d={svgPaths.p3af8f100} fill="#2F2F2F" id="Union" />
        </g>
      </svg>
    </div>
  );
}

function Url() {
  return (
    <div className="content-stretch flex items-center justify-center px-[10px] relative shrink-0" data-name="url">
      <p className="[text-box-edge:cap_alphabetic] [text-box-trim:trim-both] [word-break:break-word] font-['Segoe_UI:Bold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#2f2f2f] text-[11px] whitespace-nowrap">viewport-ui.design</p>
    </div>
  );
}

function Settings() {
  return (
    <div className="h-[9.787px] relative shrink-0 w-[11.618px]" data-name="settings">
      <svg className="absolute block inset-0 size-full" fill="none" height="9.78711" preserveAspectRatio="none" viewBox="0 0 11.6182 9.78711" width="11.6182">
        <g id="settings">
          <g id="Union">
            <mask fill="white" id="path-1-inside-1_0_28">
              <path d={svgPaths.p2b0e5a80} />
            </mask>
            <path d={svgPaths.p2b0e5a80} fill="#2F2F2F" />
            <path d={svgPaths.p3ebb8d80} fill="#2F2F2F" mask="url(#path-1-inside-1_0_28)" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function MiddleIcons() {
  return (
    <div className="content-stretch flex gap-[8px] items-center justify-center relative shrink-0" data-name="middle-icons">
      <CopyLink />
      <Url />
      <Settings />
    </div>
  );
}

function Split() {
  return (
    <div className="relative shrink-0 size-[10px]" data-name="split">
      <svg className="absolute block inset-0 size-full" fill="none" height="10" preserveAspectRatio="none" viewBox="0 0 10 10" width="10">
        <g id="split">
          <rect height="9" rx="1.5" stroke="#2F2F2F" width="9" x="0.5" y="0.5" />
          <path d="M5 0V10" id="Vector 4" stroke="#2F2F2F" />
        </g>
      </svg>
    </div>
  );
}

function Minimize() {
  return (
    <div className="relative shrink-0 size-[10px]" data-name="minimize">
      <svg className="absolute block inset-0 size-full" fill="none" height="10" preserveAspectRatio="none" viewBox="0 0 10 10" width="10">
        <g id="minimize">
          <path d="M0 5H10" id="Vector 3" stroke="#2F2F2F" />
        </g>
      </svg>
    </div>
  );
}

function Maximize() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name="maximize">
      <div className="relative rounded-[1px] shrink-0 size-[10px]">
        <div aria-hidden className="absolute border border-[#2f2f2f] border-solid inset-0 pointer-events-none rounded-[1px]" />
      </div>
    </div>
  );
}

function Close() {
  return (
    <div className="relative shrink-0 size-[9.798px]" data-name="close">
      <svg className="absolute block inset-0 size-full" fill="none" height="9.79785" preserveAspectRatio="none" viewBox="0 0 9.79785 9.79785" width="9.79785">
        <g id="close">
          <path d={svgPaths.p29c5d600} fill="#2F2F2F" id="Union" />
        </g>
      </svg>
    </div>
  );
}

function RightIcons() {
  return (
    <div className="content-stretch flex gap-[36px] items-center justify-center relative shrink-0" data-name="right-icons">
      <Split />
      <Minimize />
      <Maximize />
      <Close />
    </div>
  );
}

function Toolbar() {
  return (
    <div className="relative shrink-0 w-full" data-name="Toolbar">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-between p-[9px] relative size-full">
          <LeftIcons />
          <MiddleIcons />
          <RightIcons />
        </div>
      </div>
    </div>
  );
}

function EditHere() {
  return <div className="bg-white h-[960.835px] relative rounded-[5px] shrink-0 w-[1426px]" data-name="Edit here" />;
}

function WorkspaceHeader() {
  return (
    <div className="bg-white content-stretch flex gap-[8px] h-[20px] items-center overflow-clip relative shrink-0 w-full" data-name="Workspace Header">
      <div className="relative shrink-0 size-[6px]" data-name="Ellipse">
        <svg className="absolute block inset-0 size-full" fill="none" height="6" preserveAspectRatio="none" viewBox="0 0 6 6" width="6">
          <circle cx="3" cy="3" fill="#0A84FF" id="Ellipse" r="3" />
        </svg>
      </div>
      <p className="[word-break:break-word] flex-[1_0_0] font-['SF_Pro:Medium',sans-serif] font-[510] leading-[14px] min-w-px relative text-[11px] text-[rgba(46,46,46,0.5)] tracking-[0.06px]" style={{ fontVariationSettings: '"wdth" 100' }}>
        Workspace
      </p>
    </div>
  );
}

function TitleContainer() {
  return (
    <div className="content-stretch flex items-center relative shrink-0" data-name="Title Container">
      <p className="[word-break:break-word] font-['Crimson_Text:Bold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[18.729px] text-white tracking-[-0.7491px] w-[307.167px]">Your browser just became your assistant.</p>
    </div>
  );
}

function Container() {
  return (
    <div className="content-stretch flex flex-col gap-[6.662px] items-start relative shrink-0 w-full" data-name="Container">
      <TitleContainer />
      <p className="[word-break:break-word] font-['Times_New_Roman:Regular',sans-serif] leading-[0] not-italic relative shrink-0 text-[9.911px] text-[rgba(255,255,255,0.54)] tracking-[-0.1982px] w-[318px]">
        <span className="leading-[1.5]">{`Understand pages, `}</span>
        <span className="leading-[1.5] text-white">fill forms, automate repetitive work</span>
        <span className="leading-[1.5]">{`, and `}</span>
        <span className="leading-[1.5] text-white">complete tasks</span>
        <span className="leading-[1.5]">{` using `}</span>
        <span className="leading-[1.5] text-white">natural language</span>
        <span className="leading-[1.5]">—without switching tabs.</span>
      </p>
    </div>
  );
}

function ClickIndicator() {
  return (
    <div className="absolute h-[12.505px] right-[-6.19px] top-[-6.27px] w-[12.477px]" data-name="click indicator">
      <div className="absolute inset-[-6.66%_-6.67%]">
        <svg className="block size-full" fill="none" height="14.1702" preserveAspectRatio="none" viewBox="0 0 14.1428 14.1702" width="14.1428">
          <g id="click indicator">
            <rect fill="#A16AFF" fillOpacity="0.8" height="12.5047" rx="6.23867" width="12.4773" x="0.832735" y="0.832735" />
            <rect height="13.3375" rx="6.65504" stroke="#A16AFF" strokeOpacity="0.4" strokeWidth="0.832735" width="13.3101" x="0.416367" y="0.416367" />
            <ellipse cx="7.07155" cy="7.0851" fill="#753DB0" id="Ellipse 1" rx="2.075" ry="2.0887" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Button() {
  return (
    <div className="bg-[#2b2830] content-stretch flex gap-[4.164px] items-center justify-center p-[5.829px] relative rounded-[3.331px] shrink-0" data-name="Button">
      <p className="[text-box-edge:cap_alphabetic] [text-box-trim:trim-both] [word-break:break-word] font-['SF_Pro_Text:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[5.829px] text-white whitespace-nowrap">Start now</p>
      <ClickIndicator />
    </div>
  );
}

function HeroText() {
  return (
    <div className="content-stretch flex flex-col gap-[9.993px] h-[114.038px] items-start p-[9.993px] relative rounded-[4.996px] shrink-0 w-[332px]" data-name="Hero Text">
      <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[4.996px] size-full" src={imgHeroText} />
      <div aria-hidden className="absolute border-[#e0e0ca] border-[0.416px] border-solid inset-[-0.416px] pointer-events-none rounded-[5.412000000000001px]" />
      <Container />
      <Button />
    </div>
  );
}

function SuggestionChip() {
  return (
    <div className="bg-[rgba(249,249,251,0.9)] relative rounded-[100px] shrink-0" data-name="Suggestion Chip">
      <div className="[word-break:break-word] content-stretch flex font-['SF_Pro:Medium',sans-serif] font-[510] gap-[6px] items-center leading-[normal] overflow-clip px-[12px] py-[8px] relative rounded-[inherit] size-full whitespace-nowrap">
        <p className="relative shrink-0 text-[#0a84ff] text-[10px]" style={{ fontVariationSettings: '"wdth" 100' }}>
          ✎
        </p>
        <p className="relative shrink-0 text-[10.5px] text-[rgba(46,46,46,0.85)]" style={{ fontVariationSettings: '"wdth" 100' }}>
          Rewrite this in my tone
        </p>
      </div>
      <div aria-hidden className="absolute border border-[rgba(0,0,0,0.06)] border-solid inset-0 pointer-events-none rounded-[100px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.06)]" />
    </div>
  );
}

function SuggestionChip1() {
  return (
    <div className="bg-[rgba(249,249,251,0.9)] relative rounded-[100px] shrink-0" data-name="Suggestion Chip">
      <div className="[word-break:break-word] content-stretch flex font-['SF_Pro:Medium',sans-serif] font-[510] gap-[6px] items-center leading-[normal] overflow-clip px-[12px] py-[8px] relative rounded-[inherit] size-full whitespace-nowrap">
        <p className="relative shrink-0 text-[#0a84ff] text-[10px]" style={{ fontVariationSettings: '"wdth" 100' }}>
          ✦
        </p>
        <p className="relative shrink-0 text-[10.5px] text-[rgba(46,46,46,0.85)]" style={{ fontVariationSettings: '"wdth" 100' }}>
          Summarize this page
        </p>
      </div>
      <div aria-hidden className="absolute border border-[rgba(0,0,0,0.06)] border-solid inset-0 pointer-events-none rounded-[100px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.06)]" />
    </div>
  );
}

function SuggestionChip2() {
  return (
    <div className="bg-[rgba(249,249,251,0.9)] relative rounded-[100px] shrink-0" data-name="Suggestion Chip">
      <div className="[word-break:break-word] content-stretch flex font-['SF_Pro:Medium',sans-serif] font-[510] gap-[6px] items-center leading-[normal] overflow-clip px-[12px] py-[8px] relative rounded-[inherit] size-full whitespace-nowrap">
        <p className="relative shrink-0 text-[#0a84ff] text-[10px]" style={{ fontVariationSettings: '"wdth" 100' }}>
          ↩
        </p>
        <p className="relative shrink-0 text-[10.5px] text-[rgba(46,46,46,0.85)]" style={{ fontVariationSettings: '"wdth" 100' }}>
          Draft a quick reply
        </p>
      </div>
      <div aria-hidden className="absolute border border-[rgba(0,0,0,0.06)] border-solid inset-0 pointer-events-none rounded-[100px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.06)]" />
    </div>
  );
}

function SuggestionChip3() {
  return (
    <div className="bg-[rgba(249,249,251,0.9)] relative rounded-[100px] shrink-0" data-name="Suggestion Chip">
      <div className="[word-break:break-word] content-stretch flex font-['SF_Pro:Medium',sans-serif] font-[510] gap-[6px] items-center leading-[normal] overflow-clip px-[12px] py-[8px] relative rounded-[inherit] size-full whitespace-nowrap">
        <p className="relative shrink-0 text-[#0a84ff] text-[10px]" style={{ fontVariationSettings: '"wdth" 100' }}>
          ✓
        </p>
        <p className="relative shrink-0 text-[10.5px] text-[rgba(46,46,46,0.85)]" style={{ fontVariationSettings: '"wdth" 100' }}>{`Fix grammar & clarity`}</p>
      </div>
      <div aria-hidden className="absolute border border-[rgba(0,0,0,0.06)] border-solid inset-0 pointer-events-none rounded-[100px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.06)]" />
    </div>
  );
}

function SuggestedPrompts() {
  return (
    <div className="content-center flex flex-wrap gap-[8px] items-center justify-center overflow-clip relative shrink-0 w-[332px]" data-name="Suggested Prompts">
      <SuggestionChip />
      <SuggestionChip1 />
      <SuggestionChip2 />
      <SuggestionChip3 />
    </div>
  );
}

function CenterContent() {
  return (
    <div className="bg-white flex-[1_0_0] min-h-px relative w-full" data-name="Center Content">
      <div className="flex flex-col items-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex flex-col gap-[24px] items-center pt-[8px] relative size-full">
          <div className="[word-break:break-word] font-['SF_Pro:Semibold',sans-serif] font-[590] leading-[0] relative shrink-0 text-[#2e2e2e] text-[22px] text-center tracking-[0.35px] whitespace-nowrap" style={{ fontVariationSettings: '"wdth" 100' }}>
            <p className="leading-[28px] mb-0">What would you like to</p>
            <p className="leading-[28px]">accomplish today?</p>
          </div>
          <SuggestedPrompts />
        </div>
      </div>
    </div>
  );
}

function Group3() {
  return (
    <div className="absolute contents left-px top-[1.58px]">
      <div className="absolute left-px size-[24px] top-[1.58px]" data-name="Ellipse">
        <div className="absolute inset-[-41.67%]">
          <svg className="block size-full" fill="none" height="44" preserveAspectRatio="none" viewBox="0 0 44 44" width="44">
            <g filter="url(#filter0_f_0_40)" id="Ellipse" opacity="0.35">
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
      <p className="[word-break:break-word] absolute bg-clip-text font-['SF_Pro:Regular',sans-serif] font-normal leading-[normal] left-[6px] text-[16px] text-[transparent] top-[4px] whitespace-nowrap" style={{ fontVariationSettings: '"wdth" 100', backgroundImage: "linear-gradient(237.2647755253105deg, rgb(10, 132, 255) 11.238%, rgb(6, 79, 153) 86.714%)" }}>
        ✦
      </p>
    </div>
  );
}

function SparkleGlow() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Sparkle Glow">
      <Group3 />
    </div>
  );
}

function SearchActionContainer() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Search Action Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="24" preserveAspectRatio="none" viewBox="0 0 24 24" width="24">
        <g filter="url(#filter0_i_0_6)" id="Search Action Container">
          <rect fill="#0072ED" height="24" rx="12" width="24" />
          <path clipRule="evenodd" d={svgPaths.p3b6f0980} fill="white" fillRule="evenodd" id="Vector" />
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

function TaskComposer() {
  return (
    <div className="absolute bg-[rgba(249,249,251,0.9)] h-[68px] left-[24px] rounded-tl-[20px] rounded-tr-[20px] top-[659px] w-[332px]" data-name="Task Composer">
      <div className="content-stretch flex gap-[12px] items-center overflow-clip px-[20px] relative rounded-[inherit] size-full">
        <SparkleGlow />
        <p className="[word-break:break-word] flex-[1_0_0] font-['SF_Pro:Regular',sans-serif] font-normal leading-[normal] min-w-px relative text-[10px] text-[rgba(46,46,46,0.4)]" style={{ fontVariationSettings: '"wdth" 100' }}>
          Ask, automate, or tell me what to do...
        </p>
        <SearchActionContainer />
      </div>
      <div aria-hidden className="absolute border-[1.5px] border-[rgba(10,132,255,0.22)] border-solid inset-0 pointer-events-none rounded-tl-[20px] rounded-tr-[20px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.18)]" />
    </div>
  );
}

function Group() {
  return (
    <div className="absolute inset-[11.46%_18.75%]" data-name="Group">
      <div className="absolute inset-[-5.41%_-6.66%_-5.41%_-6.67%]">
        <svg className="block size-full" fill="none" height="7.08622" preserveAspectRatio="none" viewBox="0 0 5.87638 7.08622" width="5.87638">
          <g id="Group">
            <path d={svgPaths.p2f050280} id="Vector" stroke="#125E07" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.691339" />
            <path d={svgPaths.p10a72b40} id="Vector_2" stroke="#125E07" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.691339" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function ProiconsDocument() {
  return (
    <div className="overflow-clip relative shrink-0 size-[8.296px]" data-name="proicons:document">
      <Group />
    </div>
  );
}

function BenefitItem() {
  return (
    <div className="content-stretch flex gap-[2.765px] items-center relative shrink-0" data-name="Benefit Item">
      <ProiconsDocument />
      <p className="[word-break:break-word] font-['SF_Pro:Medium',sans-serif] font-[510] leading-[normal] relative shrink-0 text-[#146f31] text-[6.452px] whitespace-nowrap" style={{ fontVariationSettings: '"wdth" 100' }}>
        No setup required
      </p>
    </div>
  );
}

function Group1() {
  return (
    <div className="absolute inset-[16.67%_8.34%_16.67%_8.32%]" data-name="Group">
      <div className="absolute inset-[-6.25%_-5%]">
        <svg className="block size-full" fill="none" height="6.222" preserveAspectRatio="none" viewBox="0 0 7.60472 6.222" width="7.60472">
          <g id="Group">
            <path d={svgPaths.p2c703800} id="Vector" stroke="#125E07" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.691339" />
            <path d={svgPaths.p1e09e440} id="Vector_2" stroke="#125E07" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.691339" />
            <path d={svgPaths.pea8e900} id="Vector_3" stroke="#125E07" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.691339" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function HugeiconsMoneyRemove() {
  return (
    <div className="overflow-clip relative shrink-0 size-[8.296px]" data-name="hugeicons:money-remove-02">
      <Group1 />
    </div>
  );
}

function BenefitItem1() {
  return (
    <div className="content-stretch flex gap-[2.765px] items-center relative shrink-0" data-name="Benefit Item">
      <HugeiconsMoneyRemove />
      <p className="[word-break:break-word] font-['SF_Pro:Medium',sans-serif] font-[510] leading-[normal] relative shrink-0 text-[#146f31] text-[6.452px] whitespace-nowrap" style={{ fontVariationSettings: '"wdth" 100' }}>
        Free to try
      </p>
    </div>
  );
}

function RiRefund2Line() {
  return (
    <div className="relative shrink-0 size-[8.296px]" data-name="ri:refund-2-line">
      <svg className="absolute block inset-0 size-full" fill="none" height="8.29606" preserveAspectRatio="none" viewBox="0 0 8.29606 8.29606" width="8.29606">
        <g id="ri:refund-2-line">
          <path d={svgPaths.p1d5f1000} fill="#125E07" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function BenefitItem2() {
  return (
    <div className="content-stretch flex gap-[2.765px] items-center relative shrink-0" data-name="Benefit Item">
      <RiRefund2Line />
      <p className="[word-break:break-word] font-['SF_Pro:Medium',sans-serif] font-[510] leading-[normal] relative shrink-0 text-[#146f31] text-[6.452px] whitespace-nowrap" style={{ fontVariationSettings: '"wdth" 100' }}>
        Undo anytime
      </p>
    </div>
  );
}

function FluentPersonSupport28Regular() {
  return (
    <div className="relative shrink-0 size-[8.296px]" data-name="fluent:person-support-28-regular">
      <svg className="absolute block inset-0 size-full" fill="none" height="8.29606" preserveAspectRatio="none" viewBox="0 0 8.29606 8.29606" width="8.29606">
        <g id="fluent:person-support-28-regular">
          <path d={svgPaths.pf80bb80} fill="#125E07" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function BenefitItem3() {
  return (
    <div className="content-stretch flex gap-[2.765px] items-center relative shrink-0" data-name="Benefit Item">
      <FluentPersonSupport28Regular />
      <p className="[word-break:break-word] font-['SF_Pro:Medium',sans-serif] font-[510] leading-[normal] relative shrink-0 text-[#146f31] text-[6.452px] whitespace-nowrap" style={{ fontVariationSettings: '"wdth" 100' }}>
        24/7 AI support
      </p>
    </div>
  );
}

function SearchBenefits() {
  return (
    <div className="absolute bg-[rgba(52,199,89,0.12)] content-stretch flex gap-[5.656px] h-[34px] items-center justify-center left-[24px] pb-[4.525px] pt-[3.394px] px-[5.656px] rounded-bl-[20px] rounded-br-[20px] top-[727px] w-[332px]" data-name="Search Benefits">
      <BenefitItem />
      <BenefitItem1 />
      <BenefitItem2 />
      <BenefitItem3 />
    </div>
  );
}

function Group2() {
  return (
    <div className="absolute contents left-[24px] top-[659px]">
      <TaskComposer />
      <SearchBenefits />
    </div>
  );
}

function RecentItem() {
  return (
    <div className="bg-[rgba(249,249,251,0.6)] relative rounded-[10px] shrink-0 w-full" data-name="Recent Item">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="[word-break:break-word] content-stretch flex font-['SF_Pro:Regular',sans-serif] font-normal gap-[10px] items-center leading-[normal] px-[10px] py-[8px] relative size-full">
          <p className="relative shrink-0 text-[#0a84ff] text-[12px] whitespace-nowrap" style={{ fontVariationSettings: '"wdth" 100' }}>
            ✉
          </p>
          <p className="flex-[1_0_0] min-w-px relative text-[#2e2e2e] text-[10.5px]" style={{ fontVariationSettings: '"wdth" 100' }}>
            Reply to Sarah — Product roadmap
          </p>
          <p className="relative shrink-0 text-[9px] text-[rgba(46,46,46,0.45)] text-right whitespace-nowrap" style={{ fontVariationSettings: '"wdth" 100' }}>
            2h ago
          </p>
        </div>
      </div>
    </div>
  );
}

function RecentItem1() {
  return (
    <div className="bg-[rgba(249,249,251,0.6)] relative rounded-[10px] shrink-0 w-full" data-name="Recent Item">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="[word-break:break-word] content-stretch flex font-['SF_Pro:Regular',sans-serif] font-normal gap-[10px] items-center leading-[normal] px-[10px] py-[8px] relative size-full">
          <p className="relative shrink-0 text-[#0a84ff] text-[12px] whitespace-nowrap" style={{ fontVariationSettings: '"wdth" 100' }}>
            ✍
          </p>
          <p className="flex-[1_0_0] min-w-px relative text-[#2e2e2e] text-[10.5px]" style={{ fontVariationSettings: '"wdth" 100' }}>
            LinkedIn post draft
          </p>
          <p className="relative shrink-0 text-[9px] text-[rgba(46,46,46,0.45)] text-right whitespace-nowrap" style={{ fontVariationSettings: '"wdth" 100' }}>
            Yesterday
          </p>
        </div>
      </div>
    </div>
  );
}

function RecentItem2() {
  return (
    <div className="bg-[rgba(249,249,251,0.6)] relative rounded-[10px] shrink-0 w-full" data-name="Recent Item">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="[word-break:break-word] content-stretch flex font-['SF_Pro:Regular',sans-serif] font-normal gap-[10px] items-center leading-[normal] px-[10px] py-[8px] relative size-full">
          <p className="relative shrink-0 text-[#0a84ff] text-[12px] whitespace-nowrap" style={{ fontVariationSettings: '"wdth" 100' }}>
            ✎
          </p>
          <p className="flex-[1_0_0] min-w-px relative text-[#2e2e2e] text-[10.5px]" style={{ fontVariationSettings: '"wdth" 100' }}>
            Meeting follow-up email
          </p>
          <p className="relative shrink-0 text-[9px] text-[rgba(46,46,46,0.45)] text-right whitespace-nowrap" style={{ fontVariationSettings: '"wdth" 100' }}>
            2 days ago
          </p>
        </div>
      </div>
    </div>
  );
}

function RecentSection() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[6px] items-start left-[24px] overflow-clip pb-[2px] top-[785px] w-[332px]" data-name="Recent Section">
      <p className="[word-break:break-word] font-['SF_Pro:Medium',sans-serif] font-[510] leading-[normal] relative shrink-0 text-[11px] text-[rgba(46,46,46,0.5)] tracking-[0.06px] w-full" style={{ fontVariationSettings: '"wdth" 100' }}>
        Recent
      </p>
      <RecentItem />
      <RecentItem1 />
      <RecentItem2 />
    </div>
  );
}

function AiWorkspaceIdleState() {
  return (
    <div className="bg-white content-stretch drop-shadow-[0px_2px_3px_rgba(0,0,0,0.16),0px_8px_12px_rgba(0,0,0,0.28)] flex flex-col h-[960.835px] items-start pb-[40px] pt-[24px] px-[24px] relative rounded-[12px] shrink-0 w-[380px]" data-name="AI Workspace — Idle (State 1)">
      <div aria-hidden className="absolute border border-[rgba(0,0,0,0.06)] border-solid inset-0 pointer-events-none rounded-[12px]" />
      <WorkspaceHeader />
      <HeroText />
      <CenterContent />
      <Group2 />
      <RecentSection />
    </div>
  );
}

function Content() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-[8px] items-start min-h-px relative w-full" data-name="Content">
      <EditHere />
      <AiWorkspaceIdleState />
    </div>
  );
}

export default function ArcBrowser() {
  return (
    <div className="backdrop-blur-[26px] bg-[rgba(201,201,201,0.4)] content-stretch flex flex-col items-start pb-[8px] px-[8px] relative rounded-[8px] size-full" data-name="Arc Browser">
      <div aria-hidden className="absolute border border-[rgba(0,0,0,0.17)] border-solid inset-0 pointer-events-none rounded-[8px] shadow-[0px_12px_50px_0px_rgba(0,0,0,0.4)]" />
      <Toolbar />
      <Content />
    </div>
  );
}