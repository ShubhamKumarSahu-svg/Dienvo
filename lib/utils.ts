import { subjectsColors, voices } from '@/constants';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getSubjectColor = (subject: string) => {
  return subjectsColors[subject as keyof typeof subjectsColors] || '#E5D0FF';
};

// Generates Vapi assistant payload based on companion preferences
export const configureAssistant = (
  name: string,
  subject: string,
  topic: string,
  voice: string,
  style: string
) => {
  const voiceId =
    voices[voice as keyof typeof voices]?.[
      style as keyof (typeof voices)[keyof typeof voices]
    ] || 'sarah';

  const vapiAssistant = {
    name: name || 'Companion',
    firstMessage: `Hello there! I am ${name}, your ${subject} tutor. Today we're going to learn about ${topic}. Let's get started, shall we?`,
    transcriber: {
      provider: 'deepgram' as const,
      model: 'nova-3',
      language: 'en',
    },
    voice: {
      provider: '11labs' as const,
      voiceId: voiceId,
      stability: 0.4,
      similarityBoost: 0.8,
      speed: 0.9,
      style: 0.5,
      useSpeakerBoost: true,
    },
    model: {
      provider: 'openai' as const,
      model: 'gpt-4',
      messages: [
        {
          role: 'system' as const,
          content: `You are ${name}, a highly encouraging and intelligent ${subject} tutor. You are leading a real-time voice lesson with a student.
                    
                    Your guidelines:
                    1. Focus on teaching the topic: "${topic}" under the subject: "${subject}".
                    2. Maintain a "${style}" style of conversation.
                    3. Explain concepts in small, digestible chunks, asking checking questions to make sure the student is following.
                    4. Keep your responses short (under 3 sentences) to simulate a real human conversation.
                    5. Avoid all special characters, markdown tags (like asterisks, bolding, lists, hash signs), and emojis, as your text is fed directly into a Text-To-Speech engine.`,
        },
      ],
    },
    clientMessages: [],
    serverMessages: [],
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return vapiAssistant as any;
};
