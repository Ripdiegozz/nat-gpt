import { ConvexClientProvider } from "./convex-provider";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  return <ConvexClientProvider>{children}</ConvexClientProvider>;
};
