import { fetchAuthQuery } from '@/lib/auth-server';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import DemographicsPreview from './demographics-preview';
import QuickActions from './quick-actions';
import ScrybeInput from './scrybe-input';

interface PatientSidebarProps {
  params: Promise<{ patientId: string }>;
}

export default async function PatientSidebar({ params }: PatientSidebarProps) {
  const { patientId } = await params;
  
  const patient = await fetchAuthQuery(api.patients.getPatient, { 
    patientId: patientId as Id<"patients"> 
  });

  if (!patient) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      <DemographicsPreview patient={patient} patientId={patientId} />
      <QuickActions patientId={patientId} />
      <ScrybeInput patientId={patientId} />
    </div>
  );
}
