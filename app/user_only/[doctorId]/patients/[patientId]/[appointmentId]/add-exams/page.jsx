'use client'
import Link from 'next/link';
// import prisma from '../../../../../../../utils/prisma'
import BeatLoader  from 'react-spinners/BeatLoader';
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
// import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
import { ListItemNode, ListNode } from "@lexical/list";
import OnChangePlugin from '@lexical/react/LexicalOnChangePlugin'
import ToolbarPlugin from "../../../../../../../components/listToolBar";
import PlaygroundTheme from "../../../../../../../components/playgroundTheme";
import prepopulatedText from "../../../../../../../components/sampleText";
import Placeholder from '../../../../../../../components/placeholder';

const editorConfig = {
  editorState: prepopulatedText,
  theme: PlaygroundTheme,
  onError(error) {
    throw error;
  },
  nodes: [ListNode, ListItemNode]
};

// async function getAppointment(appointmentId){
//   const appointment = await prisma.appointment.findUnique({
//     where:{
//       id:appointmentId
//     },
//   })
//   return appointment
// }

export const dynamic = 'force-dynamic';

const AddExamsPage =  ({params: {doctorId, patientId, appointmentId}}) => {
  // const appointment = await getAppointment(appointmentId)
  return (
    <div className='pt-4'>
      <div className="w-full h-auto shadow-md rounded-lg p-4 bg-slate-50 text-sm text-slate-900 ">
        <div className="flex flex-row justify-between">
          {/* <p className='text-blue-500'>Appointment <span className='font-bold '>{format(appointment.startDate, 'yyy-MM-dd hh:mm:ss')}</span></p> */}
          <Link href={`/user_only/${doctorId}/patients/${patientId}/${appointmentId}`} className="px-4 py-2 rounded-full bg-slate-200 text-blue-500">
            Leave
          </Link>
        </div>
        <label className="flex flex-col mb-4">
              <span className="font-medium">Lab exams</span>
              <LexicalComposer initialConfig={editorConfig}>
                <div className="bg-white shadow-md h-60 overflow-scroll rounded-md py-2 px-4 border-none">
                  <ToolbarPlugin />
                  <RichTextPlugin
                    contentEditable={<ContentEditable className="outline-none" />}
                    placeholder={<Placeholder className="pointer-events-none" />}
                  />
                  <ListPlugin />
                  {/* <CheckListPlugin /> */}
                </div>
              </LexicalComposer>
            </label>
      </div>
    </div>
  )
}

export default AddExamsPage