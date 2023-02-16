'use client'
import  {useState, CSSProperties} from 'react';
import Doctor from '../../../components/doctor';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import * as yup from "yup";
import { yupResolver } from '@hookform/resolvers/yup';
import PulseLoader from "react-spinners/PulseLoader"
import supabase from '../../utils/supabase';
import { useRouter } from 'next/navigation';
import Header from '../header';


export default function Signup() {

  const override= {
    display: "block",
    margin: "auto",
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
  };

  

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [color, setColor] = useState('#22C55E')

  const schema = yup.object({
    firstname: yup.string().required('Please enter your first name'),
    lastname: yup.string().required('Please enter your last name'),
    email: yup.string().email('Invalid email').required('Please enter your email'),
    password: yup.string().required('Please enter your password'),
    terms: yup.boolean().required('Please confirm you reada and accpept the terms').oneOf([true], "The terms and conditions must be accepted.")
  }).required();

  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema)
  });

  const onSubmit = (data) => createUser(data);


  const createUser = async (values) => {
    setLoading(true)

    const {firstname, lastname, email, password} = values
    const { data: user, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    })
    

    if(user){
      // const user = data.user
      const {error} = await supabase.from('Doctor')
      .insert(
        {id: user.user.id,  firstname, lastname, email, }
      )
      if(error){
        setError(error)
        setLoading(false)
        console.log('error :>> ', error);
      }else{
        router.push('/success')
      }

    }

    if(error){
      setError(error)
    }

    // setLoading(false)
  }

  return (
    <div className="py-2 px-4">
      <Header />
      <div className="flex flex-row pt-4">
        <div className="basis-1/2 pl-4 mx-12">
          <h2 className="text-3xl text-slate-900 font-bold">
            Sign <span className="text-green-500">Up</span>
          </h2>
          <p className="text-slate-900 text-sm">
            Already have an account?{' '}
            <Link href="/" className="text-green-500 font-semibold">
              Log in
            </Link>
          </p>
        </div>
        <div className="basis-1/2">
          <Doctor className="mx-auto" />
        </div>
      </div>
    </div>
  );
}
