export default function GlassPanel({ className = "", children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={className}
      style={{
        background: "rgba(30, 41, 59, 0.4)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(51, 65, 85, 0.5)",
      }}
      {...props}
    >
      {children}
    </div>
  );
}
