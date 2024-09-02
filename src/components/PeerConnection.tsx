//@ts-nocheck
'use client'

import { useState, useRef, useEffect } from 'react'
import { CameraIcon, Check, LeafIcon, LoaderCircleIcon, MicIcon, MicOffIcon, MusicIcon, Phone, Power, Rocket, Search, SearchCheck, VideoIcon, VideoOffIcon } from 'lucide-react'
import Peer from 'peerjs';
import { BASE_URL } from '@/lib/utils';

export default function PeerConnection() {
  const [peerId, setPeerId] = useState('');
  const [remotePeerIdValue, setRemotePeerIdValue] = useState('');
  const [isCalling, setIsCalling] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [isSecureContext, setIsSecureContext] = useState(true);
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const remoteVideoRef = useRef(null);
  const currentUserVideoRef = useRef(null);
  const peerInstance = useRef(null);
  const connectionRef = useRef(null);
  const userStreamRef = useRef(null);

  var iceArray = [{ "Credential": null, "Username": null, "Url": "stun:global.stun.twilio.com:3478?transport=udp", "Urls": "stun:global.stun.twilio.com:3478?transport=udp" }];
  let firstTimeLock = true;
  useEffect(() => {
    setIsSecureContext(window.isSecureContext);

    const peer = new Peer(undefined, {
      config: {
        iceServers: [
          {
            urls: "stun:stun.relay.metered.ca:80",
          },
          {
            urls: "turn:global.relay.metered.ca:80",
            username: "9aefd3d63c51ed9793ee8477",
            credential: "Wd33VTkVy8vG3bLz",
          },
          {
            urls: "turn:global.relay.metered.ca:80?transport=tcp",
            username: "9aefd3d63c51ed9793ee8477",
            credential: "Wd33VTkVy8vG3bLz",
          },
          {
            urls: "turn:global.relay.metered.ca:443",
            username: "9aefd3d63c51ed9793ee8477",
            credential: "Wd33VTkVy8vG3bLz",
          },
          {
            urls: "turns:global.relay.metered.ca:443?transport=tcp",
            username: "9aefd3d63c51ed9793ee8477",
            credential: "Wd33VTkVy8vG3bLz",
          },
        ],
        secure: true
      }
    });
    
    peer.on('open', (id) => {
      setPeerId(id)
    });

    peer.on('call', (call) => {
      if (isSecureContext) {
        handleIncomingCall(call);
      } else {
        alert("Incoming call received, but video is not available in non-secure context. You can use text chat.");
      }
    });

    peer.on('connection', (conn) => {
      connectionRef.current = conn;
      setupConnectionListeners(conn);
    });

    peerInstance.current = peer;
  }, [isSecureContext]);

  const handleIncomingCall = (call) => {
    setIsCalling(false);
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((mediaStream) => {
        userStreamRef.current = mediaStream;
        currentUserVideoRef.current.srcObject = mediaStream;
        currentUserVideoRef.current.play();
        call.answer(mediaStream)
        call.on('stream', function(remoteStream) {
          remoteVideoRef.current.srcObject = remoteStream
          remoteVideoRef.current.play();
        });
      })
      .catch(err => {
        console.error("Error accessing media devices.", err);
      });
  }

  const call = (remotePeerId) => {
    if (isSecureContext) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((mediaStream) => {
          userStreamRef.current = mediaStream;
          currentUserVideoRef.current.srcObject = mediaStream;
          currentUserVideoRef.current.play();

          const call = peerInstance.current.call(remotePeerId, mediaStream)

          call.on('stream', (remoteStream) => {
            remoteVideoRef.current.srcObject = remoteStream
            remoteVideoRef.current.play();
          });
        })
        .catch(err => {
          console.error("Error accessing media devices.", err);
        });
    } else {
      alert("Video call is not available in non-secure context. You can use text chat.");
    }

    const conn = peerInstance.current.connect(remotePeerId);
    connectionRef.current = conn;
    setupConnectionListeners(conn);
  }

  const setupConnectionListeners = (conn) => {
    conn.on('open', () => {
      console.log("Text chat connection established");
    });

    conn.on('data', (data) => {
      setMessages(prevMessages => [...prevMessages, { text: data, sender: 'remote' }]);
    });
  }

  const sendMessage = () => {
    if (currentMessage && connectionRef.current) {
      connectionRef.current.send(currentMessage);
      setMessages(prevMessages => [...prevMessages, { text: currentMessage, sender: 'local' }]);
      setCurrentMessage('');
    }
  }

  const toggleMic = () => {
    if (userStreamRef.current) {
      const audioTrack = userStreamRef.current.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsMicOn(audioTrack.enabled);
    }
  }

  const toggleVideo = () => {
    if (userStreamRef.current) {
      const videoTrack = userStreamRef.current.getVideoTracks()[0];
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoOn(videoTrack.enabled);
    }
  }

  const hangup = () => {
    currentUserVideoRef.current.srcObject = null;
    remoteVideoRef.current.srcObject = null;
    navigator.mediaDevices.getUserMedia({ video: false, audio: false })
  }

  const getCalleeId = async() => {
    if(peerId.length === 0) return;
    const body = JSON.stringify({connectionId:peerId, category:"HACKERHOUSE"});
    window.onbeforeunload = async(event) => {
      const response = await fetch(`${BASE_URL}/connection/disconnect`,{
        method:"POST",
        headers:{
            "Content-Type": "application/json",
        },
        body
      });
    };

    const response = await fetch(`${BASE_URL}/connection/connect`,{
      method:"POST",
      headers:{
          "Content-Type": "application/json",
      },
      body
    });
    const { calleeId } = await response.json();
    if(calleeId === "") setIsCalling(true);
    else { setIsCalling(false); call(calleeId);}
  }

  return (
    <div className='grid  grid-cols-12 gap-x-4'>
      <div className='col-span-12 md:col-span-9 flex flex-col h-screen p-4 pr-0 max-h-screen'>
        <div className="flex flex-col justify-center items-center flex-1 mb-4 relative">
          {/*<div className={`absolute top-2 left-2 text-5xl duration-500 ${isCalling ? "translate-y-0" : " -translate-y-40"}`}>🚺</div>*/}
            <video ref={currentUserVideoRef} autoPlay muted playsInline className="w-1/2 h-[12rem] md:h-auto md:w-1/3 rounded-2xl border-white bg-black border-2 ml-2 absolute bottom-5 right-5" />
            <video ref={remoteVideoRef} autoPlay playsInline  className="w-full rounded-2xl h-full max-h-[95vh] overflow-hidden mr-2 bg-black border-white border-2" />
            <div className='flex gap-x-2 absolute bottom-4 left-3'>
              <button
                onClick={getCalleeId}
                className="h-14 w-14 flex items-center justify-center rounded-xl bg-white text-white disabled:brightness-75"
              >
                <Search className='text-black'/>
              </button>
              <button
                onClick={toggleMic}
                className="h-14 w-14 flex items-center justify-center rounded-xl bg-white text-black disabled:brightness-75"
              >
                {isMicOn ? <MicIcon  className='h-5 w-5'/> : <MicOffIcon  className='h-5 w-5'/>}
              </button>
              <button
                onClick={toggleVideo}
                className="h-14 w-14 flex items-center justify-center rounded-xl bg-white text-black disabled:brightness-75"
              >
                {isVideoOn ? <VideoIcon  className='h-5 w-5'/> : <VideoOffIcon  className='h-5 w-5'/>}
              </button>
            </div>
            {
              isCalling &&
              <div className={`absolute flex flex-col items-center justify-center text-white text-5xl duration-500`}>
                <div className=' animate-spin'><LoaderCircleIcon className='h-20 w-20'/></div>
                <p className=' text-xl mt-5'>Searching...</p>
              </div>
            }
        </div>
        
        
      </div>
      <div className="col-span-0 hidden md:flex md:col-span-3 flex-col p-4 pl-0">    
              <div className='bg-white overflow-hidden flex-[0.98] relative w-full hidden md:block rounded-lg min-h-52 p-3 px-3'>
                <div style={{ height: '100%', overflowY: 'scroll', marginBottom: '10px' }}>
                  {messages.map((msg, index) => (
                    <div className={`font-semibold text-sm  rounded-xl p-1 px-3 ${ msg.sender === 'local' ? "rounded-tr-none bg-yellow-100" : " rounded-tl-none bg-orange-100"} mb-2 w-fit`} key={index} style={{ marginLeft: msg.sender === 'local' ? 'auto' : '0%' }}>
                      {msg.text}
                    </div>
                  ))}
                </div>
                
                <input 
                  type="text" 
                  className='w-full  bg-[rgba(0,0,0,0.02)] h-12 absolute top-[94%] rounded-xl left-0 px-4 '
                  value={currentMessage} 
                  onChange={e => setCurrentMessage(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && sendMessage()}
                />
              </div>
              {/*<UserCard />*/}
              {/*<button
                onClick={handleStart}
                disabled={isStarted}
                className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
              >
                <Rocket />
              </button>*/}
        </div>
    </div>
  )
}


function UserCard() {
  return (
    <div className='bg-white shadow rounded-2xl p-5 px-2  w-2/3'>
              <div className='h-14 w-14 bg-yellow-400 rounded-2xl mx-auto'>

              </div>
              <div className='flex items-center justify-center gap-x-1 mt-2'>
                <p className='font-semibold text-sm text-center'>tanjiro.<span className='text-orange-500 font-semibold'>eth</span></p>
                <p className='bg-orange-500 w-fit p-0.5 rounded-full'><Check  className='h-2.5 w-2.5 text-white'/></p>
                <p>🚺</p>
              </div>
             
              <div className='flex justify-center flex-wrap gap-2 mt-4'>
                <div className='border px-3 text-xs rounded-full flex items-center gap-2'><MusicIcon className='h-3 w-3'/> Music</div>
                <div className='border px-3 text-xs rounded-full flex items-center gap-2'><CameraIcon className='h-3 w-3'/> Movies</div>
                <div className='border px-3 text-xs rounded-full flex items-center gap-2'><LeafIcon className='h-3 w-3'/> Nature</div>
                <div className='border px-3 text-xs rounded-full flex items-center gap-2'><MusicIcon className='h-3 w-3'/> Music</div>
                <div className='border px-3 text-xs rounded-full flex items-center gap-2'><MusicIcon className='h-3 w-3'/> Music</div>
              </div>
      </div>
  )
}