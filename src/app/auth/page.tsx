import { redirect } from "next/navigation";

interface AuthPageProps {
  searchParams: Promise<{ mode?: string }>;
}

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const params = await searchParams;
  const mode = params.mode;

  if (mode === "signup" || mode === "register") {
    redirect("/auth/signup");
  } else {
    redirect("/auth/login");
  }
}
