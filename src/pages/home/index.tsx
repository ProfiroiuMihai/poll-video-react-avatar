/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/media-has-caption */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable new-cap */
/* eslint-disable consistent-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
  RefObject,
} from 'react';
import Webcam from 'react-webcam';
import io from 'socket.io-client';
import {
  Configuration,
  NewSessionData,
  StreamingAvatarApi,
  TaskResponse,
} from '@heygen/streaming-avatar';
import axios from 'axios';
import { Button } from '@/components';
import toastAlert from '@/utils/toastAlert';

const WebcamCapture: React.FC = () => {
  const webcamRef: RefObject<Webcam> = useRef<Webcam>(null);
  const mediaStream: RefObject<HTMLVideoElement> =
    useRef<HTMLVideoElement>(null);
  const avatar = useRef<StreamingAvatarApi | null>(null);
  const recognition = useRef<any>(null);
  const [isHygenSpeaking, setIsHygenSpeaking] = React.useState(false);
  const socket = useRef<any>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [data, setData] = useState<NewSessionData | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [speakingStarted, setSpeakingStarted] = useState<boolean>(false);
  const [transcriptData, setTranscript] = useState<string>('');

  const fetchAccessToken = async (): Promise<string> => {
    try {
      const { data: responseData } = await axios.post(
        'https://api.heygen.com/v1/streaming.create_token',
        {},
        {
          headers: {
            'x-api-key':
              'NDYwYWE2NzRmZGU2NGVjNjkxYzIwZjY1NzJhYjc5MzQtMTcxNTM1NzIyMw==',
          },
        }
      );
      const token = responseData?.data?.token;
      return token || '';
    } catch (err) {
      console.error('Error fetching access token:', err);
      return '';
    }
  };

  const updateToken = async () => {
    try {
      const newToken = await fetchAccessToken();
      avatar.current = new StreamingAvatarApi(
        new Configuration({ accessToken: newToken })
      );

      const startTalkCallback = () => {
        if (recognition.current) {
          setIsHygenSpeaking(true);
          recognition.current.stop();
          setSpeakingStarted(false);
        }
      };

      const stopTalkCallback = () => {
        setTimeout(() => {
          if (!isHygenSpeaking && recognition?.current) {
            recognition.current.start();
            setSpeakingStarted(true);
            setIsHygenSpeaking(false);
          }
        }, 1000);
      };

      avatar.current.addEventHandler('avatar_start_talking', startTalkCallback);
      avatar.current.addEventHandler('avatar_stop_talking', stopTalkCallback);

      setInitialized(true);
    } catch (err) {
      console.error('Error updating token:', err);
    }
  };

  const handleDebugStatus = (msg: string) => {
    console.log('🚀 ~ msg:', msg);
  };

  const grab = async () => {
    setIsLoading(true);
    await updateToken();

    if (!avatar.current) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await avatar.current.createStartAvatar(
        {
          newSessionRequest: {
            quality: 'low',
            avatarName: 'Justin_public_3_20240308',
            voice: { voiceId: '1840d6dd209541d18ce8fdafbdbf8ed8' },
          },
        },
        handleDebugStatus
      );
      console.log('res', res);

      setData(res);
      setStream(avatar.current.mediaStream);
    } catch (err) {
      toastAlert(
        'error',
        'reach user session limit.. Please try again in 30 seconds'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartCaptureClick = useCallback(() => {
    if (recognition.current && !speakingStarted) {
      recognition.current.start();
    }
  }, [speakingStarted]);

  const handleStopCaptureClick = useCallback(() => {
    if (recognition.current && capturing) {
      setCapturing(false);
      recognition.current.stop();
    }
  }, [capturing]);

  const handleStopAvatar = async () => {
    if (!initialized || !avatar.current) {
      return;
    }
    await avatar.current.stopAvatar({
      stopSessionRequest: { sessionId: data?.sessionId },
    });
    grab();
    toastAlert(
      'success',
      'Please Press the start recording button to continue'
    );
  };

  const handleLanguageChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setSelectedLanguage(event.target.value);
    toastAlert(
      'success',
      'Please Press the start recording button to continue'
    );
  };

  useEffect(() => {
    const init = async () => {
      const newToken = await fetchAccessToken();
      avatar.current = new StreamingAvatarApi(
        new Configuration({ accessToken: newToken })
      );
      setInitialized(true);
    };
    init();
    grab();
  }, []);

  useEffect(() => {
    if (stream && mediaStream.current) {
      mediaStream.current.srcObject = stream;
      mediaStream.current.onloadedmetadata = () => {
        mediaStream.current?.play();
      };
    }
  }, [stream]);

  useEffect(() => {
    if (
      !('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    ) {
      console.error('Speech recognition is not supported in this browser.');
      return;
    }

    recognition.current =
      'SpeechRecognition' in window
        ? // @ts-ignore
          new window.SpeechRecognition()
        : // @ts-ignore
          new window.webkitSpeechRecognition();

    recognition.current.continuous = true;
    recognition.current.interimResults = false;
    recognition.current.lang = selectedLanguage;
    recognition.current.onstart = () => {
      setSpeakingStarted(true);
    };

    recognition.current.onend = () => {
      setSpeakingStarted(false);
      console.log('recorded ended');
    };

    recognition.current.onresult = (event: any) => {
      const { transcript } = event.results[event.resultIndex][0];
      setTranscript(transcript ?? '');
    };

    recognition.current.onerror = () => {
      recognition.current?.stop();
      setSpeakingStarted(false);
    };

    return () => {
      if (recognition.current) {
        recognition.current.stop();
      }
    };
  }, [selectedLanguage]);

  useEffect(() => {
    const socketInstance = io('https://mallard-large-hen.ngrok-free.app', {
      autoConnect: true,
      reconnectionAttempts: Infinity,
      reconnection: true,
    });
    socket.current = socketInstance;

    socketInstance.on('connect', () => {
      console.log('socket client connected');
    });

    socketInstance.on('message', async ({ text }: { text: string }) => {
      console.log('Received message:', text);
      if (avatar.current && data?.sessionId) {
        const hygenSpeaking: TaskResponse = await avatar.current.speak({
          taskRequest: { text, sessionId: data.sessionId },
        });
        if (hygenSpeaking.message === 'message') {
          setIsHygenSpeaking(true);
        }
      }
    });

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [data]);

  useEffect(() => {
    if (transcriptData && socket.current) {
      if (!isHygenSpeaking) {
        socket.current.emit('speech', {
          transcript: transcriptData.trim(),
          lang: selectedLanguage ?? 'en-US',
        });
      }
    }
  }, [transcriptData]);

  console.log('speaking', speakingStarted);
  console.log('hygen speaking', isHygenSpeaking);

  return (
    <div className="p-10 bg-[#000000ad] h-screen">
      <div className="flex items-center gap-5 justify-center mb-10">
        <div>
          <label htmlFor="dd" className="text-white font-semibold mx-2">
            Select Language:
          </label>
          <select value={selectedLanguage} onChange={handleLanguageChange}>
            <option value="en-US">English</option>
            <option value="ro-RO">Romanian</option>
          </select>
        </div>
        <Button
          text="Start Recording"
          type="button"
          variant="primary"
          onClick={handleStartCaptureClick}
          className="text-white font-semibold"
          isValid={!speakingStarted}
        />
        <Button
          text="Stop Recording"
          type="button"
          variant="secondary"
          onClick={handleStopCaptureClick}
          className="bg-violet text-white font-semibold"
          isValid={speakingStarted}
        />
        <Button
          text="Stop Avatar Speaking"
          type="button"
          variant="secondary"
          onClick={handleStopAvatar}
          className="bg-violet text-white font-semibold"
          // isValid={}
        />
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div>
          <Webcam
            audio={false}
            ref={webcamRef}
            className="h-[75vh] object-cover w-full rounded-lg"
          />
        </div>
        <div>
          <div className="MediaPlayer">
            {isLoading ? (
              <div>Loading Avatar Video...</div>
            ) : (
              <video
                playsInline
                autoPlay
                width={500}
                ref={mediaStream}
                className="h-[75vh] object-cover w-full rounded-lg"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebcamCapture;
