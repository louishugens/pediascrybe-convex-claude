import { formatDistanceToNow } from 'date-fns'

type Message = {
  role: "system" | "user",
  content: string
}
export function generateDiagnosticPrompt(symptoms: string, age: string){

  const messages : Message[] = [
    // ================================ Prompt for GPT-3 ============================================
    {role: "system", content: "You are a helpful medical assistant.\
      You provide pediatricians with diagnostic suggestions based on patient's\
      symptoms and age. You are talking to a pediatrician. If you don't have enough\
      information, just type 'Insufficient information.'\
      in the language the pediatrician is using. Also, use the pediatrician's language\
      in your response. The user messages are delimited by tripple quotes. Keep in mind\
      that you ar givin insights to a pediatrician."
    },
    // ================================ Prompt for GPT-3 ============================================
    // {role: "system", content: "You are a helpful medical assistant.\
    //   You provide pediatricians with diagnostic suggestions based on patient's\
    //   symptoms and age. You will follow the below steps to provide your diagnostic suggestion:\
    //   Step 1. Identify Language: What is the language of the input symptoms? (Inner Monologue)\
    //   Step 2. Initial Assessment: Given the patient's age and symptoms, what are the initial considerations? (Inner Monologue)\
    //   Step 3. Possible Conditions: List conditions that could potentially be indicated by these symptoms. (Inner Monologue)\
    //   Step 4. Narrowing Down: What conditions can be ruled out based on the patient's age and symptoms, and which should be focused on? (Inner Monologue)\
    //   Step 5. Diagnostic Suggestion: Provide a diagnostic suggestion based on the available information. (Output)\
    //   Step 6. Additional Recommendations: Are there any further tests or consultations you would recommend? (Optional Output)\
    //   ====================================================================================================\
    //   Please respond in the language identified in Step 1. Only respond with the output for Step 5 and Step 6 if applicable.\
    //   If you don't have enough information, just respond 'Insufficient information.'\
    //   in the language identified in Step 1. The user messages are delimited by triple quotes."
    // },

    // ================================ Prompt for GPT-4 ============================================
    // {role: "system", content: "You are a helpful medical assistant.\
    //   You provide pediatricians with diagnostic suggestions based on patient's\
    //   symptoms and age. Think through the following steps internally but only output the diagnostic suggestion and any additional recommendations:\
    //   1. Identify the language of the input symptoms.\
    //   2. Consider the patient's age and symptoms for initial assessment.\
    //   3. List conditions that could potentially be indicated by these symptoms.\
    //   4. Rule out conditions based on the patient's age and symptoms, and focus on the most likely ones.\
    //   ====================================================================================================\
    //   Please respond in the language identified in the first step. If you don't have enough information, just respond 'Insufficient information.'\
    //   in the language identified in the first step. The user messages are delimited by triple quotes."
    // },
// {role: "user", content: `The patient is """${formatDistanceToNow(new Date(age))} old""" and the symptoms are """${symptoms}"""`}

    {role: "user", content: `The patient is """${formatDistanceToNow(new Date(age))} old""" and the symptoms are """${symptoms}"""`},
 // {role: "user", content: `"""${symptoms}"""`},
  ]


  return messages
}


// gpt-4 output
// Le patient pourrait avoir une infection des voies respiratoires supérieures comme un \
// rhume ou une bronchiolite, surtout en cette période de l'année. Cependant, ces symptômes \
// pourraient aussi indiquer une pneumonie. Je recommanderais de vérifier la respiration de \
// l'enfant, de rechercher des signes de détresse respiratoire et d'écouter les poumons. Si \
// les symptômes persistent ou s'aggravent, une radiographie pulmonaire pourrait être nécessaire \
// pour confirmer le diagnostic.

// gpt-3 output with prompt 1
// D'après les symptômes que vous avez décrits, il semble que le patient présente de la fièvre et \
// de la toux. Cependant, étant donné que le patient a seulement 11 mois, il est important de prendre \
// en compte son jeune âge lors de l'évaluation. Il est possible que ces symptômes soient dus à une \
// infection virale respiratoire, telle qu'un rhume ou une bronchiolite. Cependant, il est également \
// important d'exclure d'autres causes possibles, notamment une infection bactérienne ou une réaction\
//  allergique. Je vous recommande de procéder à un examen clinique approfondi et de prendre en compte \
//  d'autres symptômes ou signes cliniques pertinents pour établir un diagnostic précis.


export function generateExamsPrompt(motif: string, finding: string, age: string){

  // const messages: Message[] = [
  //   {role: "system", content: "Generate a list of lab exams based on the patient's symptoms and diagnostics.\
  //   provide it in JSON array format as follow: [{exam: \"urines\"}, {exam: \"X-ray\"}] 'exam'. \
  //   send an empty array if no exams are suggested. Only send the JSON and nothing else"},
  //   {role: "user", content: `The patient is ${formatDistanceToNow(new Date(age))}`},
  //   // {role: "system", content: "mimic the pediatrician's language and resppond as if you where the pediatrician writing the diagnostic."},
  //   // {role: "system", content: "summarize your findings in a few sentences."},
  //   {role: "user", content: motif ? `The patient symptoms are ${motif}` : ''},
  //   {role: "user", content: finding ? `The pediatrician's diagnostic is ${finding}` : ''},
  // ]

  // const messages: Message[] = [
  //   {
  //     role: "system",
  //     content: "First, identify the language in which the symptoms and findings are provided. \
  //     Then, generate a list of lab exams based on the patient's symptoms and diagnostics. \
  //     Your output should be a JSON array containing the suggested exams, and it should be in the same language as the symptoms and findings. \
  //     The format should be: [{exam: \"urines\"}, {exam: \"X-ray\"}]. \
  //     If no exams are suggested, send an empty JSON array. Your output should only contain this JSON array and nothing else."
  //   },
  //   {
  //     role: "user",
  //     content: `The patient's age is ${formatDistanceToNow(new Date(age))}`
  //   },
  //   {
  //     role: "user",
  //     content: motif ? `The symptoms presented by the patient are ${motif}` : ''
  //   },
  //   {
  //     role: "user",
  //     content: finding ? `The diagnostic provided by the pediatrician is ${finding}` : ''
  //   }
  // ];

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