import { redirect } from "next/navigation";

interface ProjectCinemaRedirectProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectCinemaRedirectPage({ params }: ProjectCinemaRedirectProps) {
  const resolvedParams = await params;
  redirect(`/cinema/${resolvedParams.id}`);
}
