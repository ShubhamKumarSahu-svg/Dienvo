'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createSession } from '@/lib/actions/companion.actions';
import { configureAssistant, getSubjectColor } from '@/lib/utils';
import animationData from '@/constants/soundwaves.json';
import Vapi from '@vapi-ai/web';
import lottie, { AnimationItem } from 'lottie-web';

interface CompanionSessionClientProps {
  companionId: string;
  subject: string;
  topic: string;
  name: string;
  userName: string;
  userImage: string;
  voice: string;
  style: string;
}

interface SavedMessage {
  role: 'user' | 'system' | 'assistant';
  content: string;
}

const CompanionSessionClient = ({
  companionId,
  subject,
  topic,
  name,
  userName,
  userImage,
  voice,
  style,
}: CompanionSessionClientProps) => {
  const router = useRouter();
  const [callStatus, setCallStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [isMuted, setIsMuted] = useState(false);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [partialTranscript, setPartialTranscript] = useState('');
  const [activeSpeaker, setActiveSpeaker] = useState<'user' | 'assistant' | null>(null);
  const [volume, setVolume] = useState(0);
  const [sessionSeconds, setSessionSeconds] = useState(0);

  const [vapiClient, setVapiClient] = useState<Vapi | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const lottieAnimRef = useRef<AnimationItem | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mockSpeakIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionSecondsRef = useRef(0);

  // Sync sessionSeconds to ref to prevent rebinding event listeners every second
  useEffect(() => {
    sessionSecondsRef.current = sessionSeconds;
  }, [sessionSeconds]);

  // Save learning session in database
  const saveSessionData = useCallback(async () => {
    const seconds = sessionSecondsRef.current;
    if (seconds < 2) return; // ignore extremely short clicks

    const finalDurationMins = Math.max(1, Math.ceil(seconds / 60));

    try {
      await createSession({
        companion_id: companionId,
        name: name,
        subject: subject,
        topic: topic,
        duration: finalDurationMins,
      });
      console.log('Session saved successfully!');
    } catch (e) {
      console.error('Failed to log learning session:', e);
    }
  }, [companionId, name, subject, topic]);

  // Initialize Vapi SDK Client on Mount
  useEffect(() => {
    const vapiPublicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;

    if (!vapiPublicKey || vapiPublicKey === 'YOUR_VAPI_PUBLIC_KEY') {
      console.warn('Vapi Public Key is not configured. Running in Demo/Simulation Mode.');
      setIsDemoMode(true);
    } else {
      try {
        const vapiInstance = new Vapi(vapiPublicKey);
        setVapiClient(vapiInstance);
      } catch (err) {
        console.error('Failed to initialize Vapi SDK:', err);
        setIsDemoMode(true);
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mockSpeakIntervalRef.current) clearInterval(mockSpeakIntervalRef.current);
    };
  }, []);

  // Handle Lottie Animation instantiation dynamically on client
  useEffect(() => {
    if (callStatus === 'connected') {
      if (!containerRef.current) return;
      try {
        const anim = lottie.loadAnimation({
          container: containerRef.current,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          animationData: animationData,
        });
        lottieAnimRef.current = anim;
      } catch (e) {
        console.error('Error loading Lottie animation:', e);
      }
    } else {
      if (lottieAnimRef.current) {
        lottieAnimRef.current.destroy();
        lottieAnimRef.current = null;
      }
    }

    return () => {
      if (lottieAnimRef.current) {
        lottieAnimRef.current.destroy();
        lottieAnimRef.current = null;
      }
    };
  }, [callStatus]);

  // Scroll to bottom on new transcripts
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, partialTranscript]);

  // Keep track of call duration
  useEffect(() => {
    if (callStatus === 'connected') {
      timerRef.current = setInterval(() => {
        setSessionSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callStatus]);

  // Vapi event hook setup
  useEffect(() => {
    if (!vapiClient) return;

    const handleCallStart = () => {
      setCallStatus('connected');
      setSessionSeconds(0);
      setMessages([]);
    };

    const handleCallEnd = () => {
      setCallStatus('disconnected');
      saveSessionData();
    };

    const handleMessage = (message: Message) => {
      if (message.type === 'transcript') {
        const transcriptMessage = message as TranscriptMessage;
        const role = transcriptMessage.role; // 'user' or 'assistant'
        const transcriptType = transcriptMessage.transcriptType; // 'partial' or 'final'
        const text = transcriptMessage.transcript;

        const mappedRole: 'user' | 'system' | 'assistant' =
          role === 'user' ? 'user' : 'assistant';

        if (transcriptType === 'final') {
          setMessages((prev) => [...prev, { role: mappedRole, content: text }]);
          setPartialTranscript('');
          setActiveSpeaker(null);
        } else if (transcriptType === 'partial') {
          setPartialTranscript(text);
          setActiveSpeaker(mappedRole);
        }
      }
    };

    const handleVolumeLevel = (level: number) => {
      setVolume(level);
    };

    const handleError = (error: unknown) => {
      console.error('Vapi connection error:', error);
      setCallStatus('disconnected');
    };

    vapiClient.on('call-start', handleCallStart);
    vapiClient.on('call-end', handleCallEnd);
    vapiClient.on('message', handleMessage);
    vapiClient.on('volume-level', handleVolumeLevel);
    vapiClient.on('error', handleError);

    return () => {
      vapiClient.off('call-start', handleCallStart);
      vapiClient.off('call-end', handleCallEnd);
      vapiClient.off('message', handleMessage);
      vapiClient.off('volume-level', handleVolumeLevel);
      vapiClient.off('error', handleError);
    };
  }, [vapiClient, saveSessionData]);

  // Demo / Simulation mode routines
  const startDemoCall = () => {
    setCallStatus('connecting');
    setMessages([]);
    setSessionSeconds(0);

    setTimeout(() => {
      setCallStatus('connected');
      
      // Simulating assistant welcoming speech
      setTimeout(() => {
        const firstMsg = `Hello there! I am ${name}, your ${subject} tutor. Today we're learning about "${topic}". Let's get started, shall we?`;
        setMessages([{ role: 'assistant', content: firstMsg }]);
        triggerVolumePulse();
      }, 1000);

      // Setup simulated user/tutor conversation loop
      let step = 0;
      mockSpeakIntervalRef.current = setInterval(() => {
        step++;
        if (step === 1) {
          // User speaks
          setPartialTranscript('That sounds great. Can you explain the basic definition?');
          setActiveSpeaker('user');
          setTimeout(() => {
            setMessages((prev) => [...prev, { role: 'user', content: 'That sounds great. Can you explain the basic definition?' }]);
            setPartialTranscript('');
            setActiveSpeaker(null);
          }, 2000);
        } else if (step === 2) {
          // Tutor speaks
          setPartialTranscript('Of course! The core concept involves breaking down the topic into fundamental layers...');
          setActiveSpeaker('assistant');
          triggerVolumePulse();
          setTimeout(() => {
            setMessages((prev) => [...prev, { role: 'assistant', content: 'Of course! The core concept involves breaking down the topic into fundamental layers, where each layer solves a specific part of the problem.' }]);
            setPartialTranscript('');
            setActiveSpeaker(null);
          }, 3500);
        } else if (step === 3) {
          // User speaks
          setPartialTranscript('Got it, makes perfect sense.');
          setActiveSpeaker('user');
          setTimeout(() => {
            setMessages((prev) => [...prev, { role: 'user', content: 'Got it, makes perfect sense.' }]);
            setPartialTranscript('');
            setActiveSpeaker(null);
          }, 1500);
        } else {
          // Periodic volume waves
          triggerVolumePulse();
        }
      }, 7000);

    }, 1500);
  };

  const stopDemoCall = () => {
    if (mockSpeakIntervalRef.current) {
      clearInterval(mockSpeakIntervalRef.current);
      mockSpeakIntervalRef.current = null;
    }
    setCallStatus('disconnected');
    saveSessionData();
  };

  const triggerVolumePulse = () => {
    let count = 0;
    const pulse = setInterval(() => {
      setVolume(Math.random() * 0.8);
      count++;
      if (count > 15) {
        clearInterval(pulse);
        setVolume(0);
      }
    }, 100);
  };

  // Toggle call state
  const handleToggleCall = () => {
    if (callStatus === 'connected' || callStatus === 'connecting') {
      if (isDemoMode) {
        stopDemoCall();
      } else if (vapiClient) {
        vapiClient.stop();
      }
    } else {
      if (isDemoMode) {
        startDemoCall();
      } else if (vapiClient) {
        setCallStatus('connecting');
        const assistantConfig = configureAssistant(name, subject, topic, voice, style);
        vapiClient.start(assistantConfig).catch((err: unknown) => {
          console.error('Failed to start call:', err);
          setCallStatus('disconnected');
        });
      }
    }
  };

  // Toggle audio mute
  const handleToggleMute = () => {
    if (isDemoMode) {
      setIsMuted(!isMuted);
    } else if (vapiClient) {
      const targetMuted = !isMuted;
      vapiClient.setMuted(targetMuted);
      setIsMuted(targetMuted);
    }
  };

  // Format Call Duration: mm:ss
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const subjectColor = getSubjectColor(subject);

  return (
    <div className="flex gap-8 justify-between items-start w-full max-lg:flex-col max-lg:items-center">
      {/* LEFT: Companion Panel and Transcripts */}
      <section className="companion-section p-6 min-h-[600px] max-lg:w-full bg-white relative flex-grow shadow-sm">
        {isDemoMode && (
          <div className="absolute top-4 right-4 bg-amber-100 text-amber-800 text-xs px-3 py-1 rounded-full font-semibold border border-amber-300 z-10">
            Sandbox Demo Mode
          </div>
        )}

        <div className="flex flex-col items-center w-full gap-2">
          <span className="subject-badge">{subject}</span>
          <h2 className="text-3xl font-bold text-center mt-2">{name}</h2>
          <p className="text-muted-foreground text-center text-sm px-4">
            Topic: {topic} ({style} style)
          </p>
          {callStatus === 'connected' && (
            <div className="flex items-center gap-2 mt-1 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
              <span className="size-2 rounded-full bg-green-500 animate-pulse" />
              Live • {formatTime(sessionSeconds)}
            </div>
          )}
        </div>

        {/* Companion Avatar / Lottie wave */}
        <div className="relative flex items-center justify-center mt-6">
          {callStatus === 'connected' && (
            <div
              ref={containerRef}
              className="companion-lottie flex items-center justify-center bg-black/5 rounded-full overflow-hidden"
            />
          )}

          {callStatus !== 'connected' && (
            <div
              className={`companion-avatar relative select-none rounded-full flex items-center justify-center transition-all duration-300 ${
                callStatus === 'connecting' ? 'animate-pulse scale-98' : 'hover:scale-102'
              }`}
              style={{
                backgroundColor: subjectColor,
                transform: `scale(${1 + volume * 0.4})`,
                transition: 'transform 0.08s ease-out',
                width: '180px',
                height: '180px',
              }}
            >
              <Image
                src={`/icons/${subject}.svg`}
                alt={subject}
                width={80}
                height={80}
                className={`opacity-80 ${callStatus === 'connecting' ? 'animate-spin duration-3000' : ''}`}
              />
            </div>
          )}
        </div>

        {/* Live Conversation Transcripts */}
        <div className="transcript w-full flex-grow border-t border-neutral-100 mt-6 min-h-[200px] max-h-[300px]">
          <div className="transcript-message no-scrollbar overflow-y-auto w-full pr-1">
            {messages.length === 0 && !partialTranscript && (
              <div className="text-center text-neutral-400 py-12 text-lg italic">
                {callStatus === 'connected'
                  ? 'Waiting for companion to speak...'
                  : 'Start the session to begin talking.'}
              </div>
            )}

            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex flex-col gap-1 my-3 ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 px-1">
                  {msg.role === 'user' ? userName : name}
                </span>
                <p
                  className={`px-4 py-2 text-base rounded-2xl max-w-[85%] leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-black text-white rounded-tr-none'
                      : 'bg-neutral-100 text-black rounded-tl-none border border-neutral-200/50'
                  }`}
                >
                  {msg.content}
                </p>
              </div>
            ))}

            {partialTranscript && (
              <div
                className={`flex flex-col gap-1 my-3 ${
                  activeSpeaker === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 px-1">
                  {activeSpeaker === 'user' ? userName : name}
                </span>
                <p
                  className={`px-4 py-2 text-base rounded-2xl max-w-[85%] leading-relaxed opacity-70 italic animate-pulse ${
                    activeSpeaker === 'user'
                      ? 'bg-black text-white rounded-tr-none'
                      : 'bg-neutral-100 text-black rounded-tl-none border border-neutral-200/50'
                  }`}
                >
                  {partialTranscript}
                </p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="transcript-fade" />
        </div>
      </section>

      {/* RIGHT: User Panel and Session Controls */}
      <section className="user-section flex flex-col gap-4 w-1/3 max-lg:w-full">
        {/* User Card */}
        <div className="user-avatar border-2 border-black flex flex-col gap-4 items-center rounded-lg py-8 bg-white shadow-sm">
          <div className="relative size-20 rounded-full border border-black overflow-hidden bg-neutral-100">
            <Image
              src={userImage}
              alt={userName}
              fill
              className="object-cover"
              sizes="80px"
            />
          </div>
          <div className="text-center">
            <h3 className="font-bold text-xl">{userName}</h3>
            <p className="text-muted-foreground text-xs">Student Explorer</p>
          </div>
        </div>

        {/* Live Mic Session Action Toggle */}
        <button
          onClick={handleToggleCall}
          className={`btn-mic group shadow-sm flex flex-col items-center gap-3 py-6 px-4 cursor-pointer text-center transition-all ${
            callStatus === 'connected'
              ? 'bg-red-50 hover:bg-red-100 border-red-500 text-red-700'
              : callStatus === 'connecting'
              ? 'bg-amber-50 hover:bg-amber-100 border-amber-500 text-amber-700'
              : 'bg-white hover:bg-neutral-50 border-black text-black'
          }`}
        >
          <div
            className={`p-4 rounded-full border ${
              callStatus === 'connected'
                ? 'bg-red-500 text-white border-red-600'
                : callStatus === 'connecting'
                ? 'bg-amber-500 text-white border-amber-600'
                : 'bg-neutral-100 text-black border-black/20 group-hover:scale-105'
            } transition duration-200`}
          >
            <Image
              src={callStatus === 'connected' ? '/icons/mic-off.svg' : '/icons/mic-on.svg'}
              alt="Mic"
              width={24}
              height={24}
              className={callStatus === 'connected' ? 'invert brightness-0' : ''}
            />
          </div>
          <div>
            <h4 className="font-bold text-lg">
              {callStatus === 'connected'
                ? 'Stop Voice Session'
                : callStatus === 'connecting'
                ? 'Connecting Tutor...'
                : 'Start Voice Session'}
            </h4>
            <p className="text-xs opacity-75 mt-0.5">
              {callStatus === 'connected'
                ? 'Click to end learning call and save log'
                : callStatus === 'connecting'
                ? 'Connecting speech pipeline...'
                : `Initiate conversation with ${name}`}
            </p>
          </div>
        </button>

        {/* Mute and Navigation Panel */}
        {callStatus === 'connected' && (
          <div className="flex gap-2 w-full">
            <button
              onClick={handleToggleMute}
              className={`flex-1 py-3 px-4 rounded-lg border-2 border-black flex items-center justify-center gap-2 font-bold cursor-pointer transition ${
                isMuted
                  ? 'bg-amber-500 text-white border-amber-600 hover:bg-amber-600'
                  : 'bg-white hover:bg-neutral-50 text-black'
              }`}
            >
              <Image
                src={isMuted ? '/icons/mic-off.svg' : '/icons/mic-on.svg'}
                alt="Mute"
                width={16}
                height={16}
                className={isMuted ? 'invert brightness-0' : ''}
              />
              {isMuted ? 'Unmute' : 'Mute Mic'}
            </button>
          </div>
        )}

        <button
          onClick={() => {
            if (callStatus === 'connected' || callStatus === 'connecting') {
              if (isDemoMode) stopDemoCall();
              else if (vapiClient) vapiClient.stop();
            }
            router.push('/companions');
          }}
          className="w-full py-3.5 bg-neutral-100 hover:bg-neutral-200 border border-black/20 text-neutral-800 font-bold rounded-lg cursor-pointer transition flex items-center justify-center gap-2"
        >
          Back to Library
        </button>
      </section>
    </div>
  );
};

export default CompanionSessionClient;
