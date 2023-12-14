'use client'
import Doctor from '@/components/doctor';
import Link from 'next/link';



export default function Signup() {


  return (
    <div className="pt-12 pb-2 px-4">
      <div className="flex flex-row pt-4">
        <div className="basis-1/2 pl-4 mx-12">
          <h2 className="text-3xl text-slate-900 font-bold">
            Sign <span className="text-primary">Up</span>
          </h2>
          <p className="text-slate-900 text-sm">
            Already have an account?{' '}
            <Link href="/" className="text-primary first-letter:font-semibold">
              Log in
            </Link>
          </p>
          <p className=" text-xl font-bold text-primary first-letter:mt-4">Congratulations</p>
          <p className="text-sm">Your account was successfully create. Please verify your email address from your mailbox and you will be allowed to login. Thank you.</p>
        </div>
        <div className="basis-1/2">
          <Doctor className="mx-auto" />
        </div>
      </div>
    </div>
  );
}
