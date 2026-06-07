import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import type { Role } from "../lib/types";

function SkeletonProtected() {
  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col animate-pulse">
      <div className="h-14 bg-surface-container border-b border-outline-variant/30 flex items-center px-container-margin">
        <div className="w-8 h-8 rounded-full bg-surface-container-highest" />
      </div>
      <div className="flex-grow flex items-center justify-center">
        <div className="w-full max-w-md px-container-margin space-y-4">
          <div className="h-8 bg-surface-container-highest rounded-lg w-1/2 mx-auto" />
          <div className="h-4 bg-surface-container-highest rounded w-3/4 mx-auto" />
          <div className="h-20 bg-surface-container-highest rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: Role[];
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <SkeletonProtected />;

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === "CREATOR" ? "/dashboard" : "/explore"} replace />;
  }

  return <>{children}</>;
}
