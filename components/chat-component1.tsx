'use client';

import { useChat } from '@ai-sdk/react';
import { useState } from 'react';
import { DefaultChatTransport } from 'ai';

export default function Chat({patientId}: {patientId: string}) {

  const [input, setInput] = useState('');
  const { messages, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: `/api/ai/chat/${patientId}`,
    })
  });
  return (
    <div className="flex flex-col w-full">
      <div className="space-y-4 h-96 overflow-y-auto">
        {messages.map(m => (
          <div key={m.id} className="whitespace-pre-wrap">
            <div>
              <div className="font-bold">{m.role === 'user' ? 'You' : 'ScrybGPT'}</div>
              {m.parts.map(part => {
                if (part.type === 'text') {
                  return <p>{part.text}</p>;
                }
                return <p>{part.type}</p>;
              })}
            </div>
          </div>
        ))}
      </div>

      <form
        onSubmit={e => {
          e.preventDefault();
          sendMessage({ text: input });
          setInput('');
        }}
      >
        <input
          className="fixed bottom-0 w-full max-w-md p-2 mb-8 border border-gray-300 rounded shadow-xl"
          value={input}
          placeholder="Say something..."
          onChange={e => setInput(e.currentTarget.value)}
        />
      </form>
    </div>
  );
}