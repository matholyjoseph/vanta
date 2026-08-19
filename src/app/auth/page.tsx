import { redirect } from "next/navigation";
import { getSafeCallbackUrl } from "@/lib/validations/auth";

interface AuthPageProps {
  searchParams: Promise<{ mode?: string; callbackUrl?: string }>;
}

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const params = await searchParams;
  const mode = params.mode;
  const safeCallback = getSafeCallbackUrl(params.callbackUrl);

  const query = safeCallback !== "/dashboard" ? `?callbackUrl=${encodeURIComponent(safeCallback)}` : "";

  if (mode === "signup" || mode === "register") {
    redirect(`/auth/signup${query}`);
  } else {
    redirect(`/auth/login${query}`);
  }
}
