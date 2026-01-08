import React, { useState, useEffect, useRef } from 'react';
import { Stomp, CompatClient } from '@stomp/stompjs';
import axios from 'axios';
import { User, ChatMessage } from './types';
import './App.css';

const GATEWAY_URL = "http://localhost:8080";
const WS_URL = "ws://localhost:8080/ws"; // Direct WebSocket URL

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>("");
  const [stompClient, setStompClient] = useState<CompatClient | null>(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      // 1. Fetch History via REST
      axios.get(`${GATEWAY_URL}/api/chat/history`, {
        headers: { Authorization: `Bearer ${user.token}` }
      }).then(res => setMessages(res.data))
          .catch(err => console.error(err));

      // 2. Connect WebSocket (Standard, No SockJS)
      const client = Stomp.client(WS_URL);
      
      // Optional: Add debug logs
      client.debug = (str) => console.log(str);

      client.connect({}, () => {
        console.log("Connected to WebSocket!");
        // Subscribe to Public Topic
        client.subscribe('/topic/public', (payload: any) => {
          const receivedMsg: ChatMessage = JSON.parse(payload.body);
          setMessages(prev => [...prev, receivedMsg]);
        });
      }, (err: any) => {
        console.error("WebSocket Connection Error:", err);
      });

      setStompClient(client);

      return () => { if (client) client.disconnect(); }
    }
  }, [user]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleAuth = async () => {
    const endpoint = isRegistering ? "/api/auth/register" : "/api/auth/login";
    try {
      const res = await axios.post(`${GATEWAY_URL}${endpoint}`, { username, password });
      if (isRegistering) {
        alert("Registration Successful. Please Login.");
        setIsRegistering(false);
      } else {
        setUser({ username, token: res.data.token });
      }
    } catch (e) { alert("Authentication Failed"); }
  };

  const sendMessage = () => {
    if (stompClient && stompClient.connected && input.trim() && user) {
      const msg: ChatMessage = { sender: user.username, content: input };
      stompClient.send("/app/sendMessage", {}, JSON.stringify(msg));
      setInput("");
    } else {
      console.error("Cannot send message: STOMP client is not connected.");
    }
  };

  if (!user) return (
      <div style={{display:'flex', justifyContent:'center', marginTop:'50px'}}>
        <div style={{border:'1px solid #ccc', padding:'20px', borderRadius:'8px', width:'300px'}}>
          <h2>ConnectHub</h2>
          <input placeholder="Username" style={{width:'100%', marginBottom:'10px', padding:'5px'}}
                 onChange={e => setUsername(e.target.value)} />
          <input type="password" placeholder="Password" style={{width:'100%', marginBottom:'10px', padding:'5px'}}
                 onChange={e => setPassword(e.target.value)} />
          <button onClick={handleAuth} style={{width:'100%', padding:'10px', background:'#007bff', color:'white', border:'none'}}>
            {isRegistering ? "Register" : "Login"}
          </button>
          <p style={{marginTop:'10px', cursor:'pointer', color:'blue', textAlign:'center'}}
             onClick={() => setIsRegistering(!isRegistering)}>
            {isRegistering ? "Back to Login" : "Need an account?"}
          </p>
        </div>
      </div>
  );

  return (
      <div style={{maxWidth:'600px', margin:'0 auto', border:'1px solid #ccc', height:'90vh', display:'flex', flexDirection:'column'}}>
        <header style={{background:'#eee', padding:'10px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <h3>ConnectHub Global Chat</h3>
          <button onClick={() => setUser(null)}>Logout</button>
        </header>

        <div style={{flex:1, overflowY:'auto', padding:'20px'}}>
          {messages.map((m, i) => (
              <div key={i} style={{
                marginBottom:'10px',
                textAlign: m.sender === user.username ? 'right' : 'left'
              }}>
                <div style={{
                  display:'inline-block',
                  background: m.sender === user.username ? '#007bff' : '#e9ecef',
                  color: m.sender === user.username ? 'white' : 'black',
                  padding:'8px 12px', borderRadius:'15px'
                }}>
                  <div style={{fontSize:'0.75rem', fontWeight:'bold', marginBottom:'2px'}}>{m.sender}</div>
                  {m.content}
                </div>
              </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div style={{padding:'10px', borderTop:'1px solid #eee', display:'flex'}}>
          <input
              style={{flex:1, padding:'10px', marginRight:'10px'}}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
          />
          <button onClick={sendMessage} style={{padding:'10px 20px'}}>Send</button>
        </div>
      </div>
  );
}
export default App;