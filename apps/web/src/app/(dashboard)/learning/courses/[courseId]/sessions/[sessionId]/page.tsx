"use client";

import React, { useCallback, useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Mic, MicOff, Video, VideoOff, MonitorUp, Hand, MessageSquare, Users, Settings, LogOut, Send, HelpCircle } from "lucide-react";

export default function LearningSessionPage() {
  const params = useParams();
  const router = useRouter();
  
  const courseId = params?.courseId as string;
  const sessionId = params?.sessionId as string;

  // Mock user since next-auth is not installed
  const userId = "mock-user-id";

  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"chat" | "participants" | "qa">("chat");
  const [chatInput, setChatInput] = useState("");
  
  // Local state for controls
  const [micEnabled, setMicEnabled] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchSessionData = useCallback(async () => {
    try {
      const res = await fetch(`/api/learning/courses/${courseId}/sessions/${sessionId}/sync`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    }
  }, [courseId, sessionId]);

  useEffect(() => {
    // Join session on mount
    fetch(`/api/learning/courses/${courseId}/sessions/${sessionId}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    fetchSessionData();

    // Heartbeat every 5s and sync data
    const interval = setInterval(() => {
      fetch(`/api/learning/courses/${courseId}/sessions/${sessionId}/presence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      fetchSessionData();
    }, 5000);

    return () => clearInterval(interval);
  }, [courseId, sessionId, userId, fetchSessionData]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data?.session?.chatMessages]);

  const toggleControl = async (control: "mic" | "camera" | "screen" | "hand") => {
    const payload: any = { userId };
    
    if (control === "mic") { setMicEnabled(!micEnabled); payload.micEnabled = !micEnabled; }
    if (control === "camera") { setCameraEnabled(!cameraEnabled); payload.cameraEnabled = !cameraEnabled; }
    if (control === "screen") { setScreenSharing(!screenSharing); payload.screenSharing = !screenSharing; }
    if (control === "hand") { setHandRaised(!handRaised); payload.handRaised = !handRaised; }

    await fetch(`/api/learning/courses/${courseId}/sessions/${sessionId}/participant`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    fetchSessionData();
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    await fetch(`/api/learning/courses/${courseId}/sessions/${sessionId}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, content: chatInput }),
    });
    setChatInput("");
    fetchSessionData();
  };

  const leaveSession = () => {
    router.push(`/learning/courses/${courseId}`);
  };

  if (!data) return <div className="flex h-screen items-center justify-center bg-gray-900 text-white">Loading Session...</div>;

  const { session, participants } = data;

  return (
    <div className="flex h-screen w-full bg-gray-950 text-white overflow-hidden font-sans">
      
      {/* Main Stage */}
      <div className="flex-1 flex flex-col relative">
        {/* Top Header */}
        <div className="h-16 flex items-center justify-between px-6 bg-gray-900/50 backdrop-blur border-b border-gray-800 z-10">
          <div>
            <h1 className="text-lg font-semibold">{session?.title || "Live Session"}</h1>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
              {participants?.length || 0} Participants
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-800 rounded-lg text-gray-300">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Grid / Screen Share Area */}
        <div className="flex-1 p-4 flex items-center justify-center relative bg-black">
           {/* Mock Video Feed */}
           <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full h-full max-h-[80vh]">
              {participants?.map((p: any) => (
                <div key={p.id} className="relative bg-gray-800 rounded-xl overflow-hidden border border-gray-700 flex flex-col items-center justify-center">
                  {p.cameraEnabled ? (
                    <div className="w-full h-full bg-gray-700 animate-pulse"></div> // Mock Video
                  ) : (
                    <div className="w-20 h-20 bg-gray-600 rounded-full flex items-center justify-center text-2xl font-bold text-gray-300">
                      {p.userId.substring(0,2).toUpperCase()}
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 bg-black/60 px-3 py-1 rounded-md text-sm flex items-center gap-2 backdrop-blur">
                    {p.userId === userId ? "You" : p.userId}
                    {!p.micEnabled && <MicOff className="w-3 h-3 text-red-400" />}
                    {p.handRaised && <Hand className="w-3 h-3 text-yellow-400" />}
                  </div>
                </div>
              ))}
           </div>
        </div>

        {/* Bottom Controls */}
        <div className="h-20 flex items-center justify-center gap-4 bg-gray-900 border-t border-gray-800 px-6">
          <button 
            onClick={() => toggleControl("mic")}
            className={`p-4 rounded-full flex items-center justify-center transition-colors ${micEnabled ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-red-500/20 hover:bg-red-500/30 text-red-500 border border-red-500/50"}`}
          >
            {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>
          
          <button 
            onClick={() => toggleControl("camera")}
            className={`p-4 rounded-full flex items-center justify-center transition-colors ${cameraEnabled ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-red-500/20 hover:bg-red-500/30 text-red-500 border border-red-500/50"}`}
          >
            {cameraEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>
          
          <button 
            onClick={() => toggleControl("screen")}
            className={`p-4 rounded-full flex items-center justify-center transition-colors ${screenSharing ? "bg-blue-600 hover:bg-blue-500 text-white" : "bg-gray-700 hover:bg-gray-600 text-gray-300"}`}
          >
            <MonitorUp className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => toggleControl("hand")}
            className={`p-4 rounded-full flex items-center justify-center transition-colors ${handRaised ? "bg-yellow-500 hover:bg-yellow-400 text-white" : "bg-gray-700 hover:bg-gray-600 text-gray-300"}`}
          >
            <Hand className="w-5 h-5" />
          </button>

          <div className="w-px h-8 bg-gray-700 mx-2"></div>
          
          <button onClick={leaveSession} className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-medium flex items-center gap-2 transition-colors">
            <LogOut className="w-4 h-4" /> Leave
          </button>
        </div>
      </div>

      {/* Right Collaboration Panel */}
      <div className="w-80 lg:w-96 bg-gray-900 border-l border-gray-800 flex flex-col z-20">
        
        {/* Tabs */}
        <div className="flex border-b border-gray-800">
          <button 
            onClick={() => setActiveTab("chat")}
            className={`flex-1 py-4 text-sm font-medium flex justify-center items-center gap-2 border-b-2 transition-colors ${activeTab === "chat" ? "border-blue-500 text-blue-500" : "border-transparent text-gray-400 hover:text-gray-200"}`}
          >
            <MessageSquare className="w-4 h-4" /> Chat
          </button>
          <button 
            onClick={() => setActiveTab("participants")}
            className={`flex-1 py-4 text-sm font-medium flex justify-center items-center gap-2 border-b-2 transition-colors ${activeTab === "participants" ? "border-blue-500 text-blue-500" : "border-transparent text-gray-400 hover:text-gray-200"}`}
          >
            <Users className="w-4 h-4" /> People
          </button>
          <button 
            onClick={() => setActiveTab("qa")}
            className={`flex-1 py-4 text-sm font-medium flex justify-center items-center gap-2 border-b-2 transition-colors ${activeTab === "qa" ? "border-blue-500 text-blue-500" : "border-transparent text-gray-400 hover:text-gray-200"}`}
          >
            <HelpCircle className="w-4 h-4" /> Q&A
          </button>
        </div>

        {/* Panel Content */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          
          {activeTab === "chat" && (
            <div className="flex-1 flex flex-col justify-end min-h-0 h-full">
              <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                {session?.chatMessages?.map((msg: any) => (
                  <div key={msg.id} className={`flex flex-col ${msg.userId === userId ? 'items-end' : 'items-start'}`}>
                    <span className="text-xs text-gray-400 mb-1">{msg.userId === userId ? 'You' : msg.userId}</span>
                    <div className={`px-4 py-2 rounded-2xl max-w-[85%] ${msg.userId === userId ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-gray-800 text-gray-200 rounded-tl-none'}`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <form onSubmit={handleSendMessage} className="mt-4 relative flex-shrink-0">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type a message..." 
                  className="w-full bg-gray-800 border border-gray-700 rounded-full px-4 py-3 pr-12 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button type="submit" disabled={!chatInput.trim()} className="absolute right-2 top-2 p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors">
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {activeTab === "participants" && (
            <div className="space-y-4">
              {participants?.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-xs font-medium relative">
                      {p.userId.substring(0,2).toUpperCase()}
                      <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-gray-900 rounded-full ${p.isOnline ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{p.userId === userId ? 'You' : p.userId}</p>
                      <p className="text-xs text-gray-400 capitalize">{p.role.toLowerCase()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    {p.handRaised && <Hand className="w-4 h-4 text-yellow-500" />}
                    {!p.micEnabled ? <MicOff className="w-4 h-4 text-red-500" /> : <Mic className="w-4 h-4" />}
                    {p.cameraEnabled && <Video className="w-4 h-4" />}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "qa" && (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
              <HelpCircle className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm">Q&A feature is coming soon.</p>
            </div>
          )}

        </div>
      </div>
      
    </div>
  );
}
