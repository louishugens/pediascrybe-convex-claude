import { useEffect, useState } from 'react'
import supabase from '../supabase';

const useDoctor = () => {
  const [doctor, setDoctor] = useState(null);


  useEffect(() => {
    getDoctor()
  }, []);

  const getDoctor = async () =>{
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