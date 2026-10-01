// Decorative backdrop: dot grid, soft tricolour orbs and faint Ashoka Chakra wheels. Purely visual.
function Chakra({ className, spin }: { className: string; spin: string }) {
  return (
    <svg viewBox="0 0 200 200" className={`absolute text-navy ${spin} ${className}`} fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="100" cy="100" r="92" strokeWidth="5" />
      <circle cx="100" cy="100" r="80" />
      <circle cx="100" cy="100" r="12" fill="currentColor" />
      {Array.from({ length: 24 }).map((_, i) => (
        <g key={i} transform={`rotate(${i * 15} 100 100)`}>
          <line x1="100" y1="112" x2="100" y2="22" />
          <circle cx="100" cy="14" r="3.5" fill="currentColor" />
        </g>
      ))}
    </svg>
  );
}

export function Background() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 [background-image:radial-gradient(rgba(0,0,128,0.13)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
      <div className="absolute -left-24 top-1/4 h-80 w-80 animate-float rounded-full bg-saffron/25 blur-3xl" />
      <div className="absolute -right-24 top-2/3 h-96 w-96 animate-float rounded-full bg-india-green/20 blur-3xl [animation-delay:-4s]" />
      <Chakra className="-right-40 top-24 h-[34rem] w-[34rem] opacity-[0.06]" spin="animate-spin-slow" />
      <Chakra className="-bottom-48 -left-48 h-[38rem] w-[38rem] opacity-[0.05]" spin="animate-spin-slow [animation-direction:reverse]" />
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-saffron via-white to-india-green" />
    </div>
  );
}
