import { fetchAuthQuery } from '@/lib/auth-server';
import { api } from '@/convex/_generated/api';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { ViewTransition } from 'react';

export default async function Greeter() {
  return (
    <h1 className="text-xl font-bold mb-2">
      Hello {" "}
      <ViewTransition>
        <Suspense 
          fallback={<Skeleton className="h-4 w-48 inline-block color-primary" />}
        >
          <GreeterContent/>
        </Suspense>
      </ViewTransition>
    </h1>
  )
}

async function GreeterContent() {
  const doctor = await fetchAuthQuery(api.doctors.getCurrent);
  
  if (!doctor) {
    return null;
  }
  return (
    <span className="text-primary">Dr. {doctor.firstname} {doctor.lastname}</span>
  )
}

