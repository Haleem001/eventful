export default function Icon({ name, fill }: { name: string; fill?: boolean }) {
  return (
    <span
      className="material-symbols-outlined text-inherit"
      style={fill ? { fontVariationSettings: "'FILL' 1" } : undefined}
    >
      {name}
    </span>
  );
}
