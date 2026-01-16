import { formatDistanceToNow } from 'date-fns'

type Message = {
  role: "system" | "user",
  content: string
}
export function generateDiagnosticPrompt(appointment: { motif?: string; height?: number | null; weight?: number | null; head?: number | null; arm?: number | null; sao2?: number | null; temperature?: number | null; pulse?: number | null; respiratory?: number | null; systolic?: number | null; diastolic?: number | null }, patient: { birthdate: Date; sex?: string | null; allergies?: string | null; history?: string | null }){

  console.log('appointment', appointment)
  console.log('patient', patient)
  const messages : Message[] = [
    {
      role: "system",
      content: "You are ScrybeGPT, a helpful medical assistant specializing in pediatrics.\
      Your task is to provide pediatricians with diagnostic suggestions based on a patient's\
      symptoms and age. When interacting with a pediatrician, follow these steps:\
      \
      1. Identify the language of the symptoms.\
      2. Analyze the symptoms and the patient's age to consider possible diagnoses.\
      3. Formulate diagnostic suggestions based on the analysis.\
      4. If there is insufficient information to make a diagnosis, respond with 'Insufficient information.'\
      5. Translate the formulated diagnostic suggestions in the language identified in step 1. \
      6. Respond with the translated diagnostic suggestions only.\
    ",
    },
    {role: "user", content: `The patient info is """${JSON.stringify(patient)}""" and the record info is """${JSON.stringify(appointment)}"""`},
    {role: "system", content: "mimic the pediatrician's language and resppond as if you where the pediatrician writing the diagnostic in the proper language."},

  ]


  return messages
}


export function generateExamsPrompt(motif: string, finding: string, age: string){


  const messages: Message[] = [
    {
      role: "system",
      content: "Step 1: Identify the language of the symptoms and findings. \
      Step 2: You are tasked with generating a list of lab exams based on the patient's symptoms and diagnostics. \
      Think through the following steps internally: \
      1. Consider the patient's age and symptoms for initial assessment. \
      2. List conditions that could potentially be indicated by these symptoms. \
      3. Rule out conditions based on the patient's age and symptoms, and focus on the most likely ones. \
      Finally, your output should be a JSON array containing the suggested exams, in the language you identified in Step 1. \
      The format should be: [{exam: \"urines\"}, {exam: \"X-ray\"}]. \
      If no exams are suggested, send an empty JSON array. Your output should only contain this JSON array and nothing else.\
      Also translate the output to the language identified in Step 1."
    },
    {
      role: "user",
      content: `The patient's age is ${formatDistanceToNow(new Date(age))}`
    },
    {
      role: "user",
      content: motif ? `The symptoms presented by the patient are ${motif}` : ''
    },
    {
      role: "user",
      content: finding ? `The diagnostic provided by the pediatrician is ${finding}` : ''
    }
  ];
  
  
  

  return messages
}