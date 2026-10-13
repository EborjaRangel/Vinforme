export function Coyote({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="31" cy="36" r="24" fill="#6B4694" />
      <path d="M24 20 33 4l8 18c-4-2-8-1-11 2-2-2-4-3-7-4z" fill="#3C2264" />
      <path
        d="M10 38c2-14 12-24 24-24-1 7-6 11-12 12 7-1 12 3 12 9-9 1-16 4-20 11-2-2-4-6-4-8z"
        fill="#3C2264"
      />
      <path
        d="M28 24c8-8 24-4 28 8 3 9-3 18-14 19-8 1-15-3-17-11 5 4 12 3 16-2-8-1-13-7-13-14z"
        fill="#E6D7F6"
      />
      <ellipse cx="44" cy="34" rx="5" ry="3.8" fill="#FFFFFF" />
      <circle cx="45.4" cy="34.2" r="2" fill="#2A1844" />
      <ellipse cx="55" cy="41" rx="3.6" ry="2.6" fill="#3C2264" />
    </svg>
  );
}
