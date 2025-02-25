'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

const useDoctor = () => {
  const [doctor, setDoctor] = useState(null);


  useEffect(() => {
    getDoctor()
  }, []);

  const getDoctor = async () =>{
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const {data, error} = await supabase.from('Doctor').select().eq('id', user.id)
      if (data) {
        setDoctor(data[0])

      }
    }
  }

  return doctor;
};

export default useDoctor;