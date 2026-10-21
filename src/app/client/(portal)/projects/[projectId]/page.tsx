import { ProjectScreen } from '@/features/portal/ProjectScreen';

export const metadata = { title: 'Project' };

export default async function Page({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return <ProjectScreen projectId={projectId} />;
}
