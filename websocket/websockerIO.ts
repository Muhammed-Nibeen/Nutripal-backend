import { Server as httpServer } from "http";
import { Server as SocketIOServer} from "socket.io"
import { Message } from "../model/message";

interface User {
  userId: String;
  role: string
}

// WEBRTC

// WEBRTC

export function configureSocket(expressServer: httpServer){
  const io = new SocketIOServer(expressServer,{
    cors:{
      origin: "http://localhost:4200",
      methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
      allowedHeaders: ["Content-Type"],
      credentials: true,
    }
  })

  const rooms: Record<string, User[]> = {};
  const broadcasters: Record<string, string> = {};

  io.on("connection",(socket)=>{
    console.log("New client connected", socket.id);
  
  // Join a room
  socket.on('joinRoom', (roomId: string) => {
    socket.join(roomId);
    console.log(`User joined room: ${roomId}`);
  });

    // Handle sendMessage
  socket.on('sendMessage', async (data: { senderId: string, receiverId: string, message: string }) => {
    const { senderId, receiverId, message } = data;
    const newMessage = new Message({ senderId, receiverId, message });
    console.log('message received: ', newMessage);
    console.log('sender:', senderId)
    console.log('reciver: ', receiverId)
    await Message.create(newMessage);

  // Emit message to the room
  const roomId = getRoomId(senderId, receiverId);
  console.log('roomId: ', roomId)
  socket.broadcast.to(roomId).emit('receiverMessage', newMessage);
  });

  // HANDILING WEBRTC SIGNALING MESSAGES

  socket.on('offer', (offer, roomId) => {
    console.log('Received offer:', offer);
    socket.to(roomId).emit('offer', offer);
    console.log("the room id is chekcig now",roomId);
    
  });

  socket.on('answer', (answer, roomId) => {
    console.log('Received answer:', answer);
    socket.to(roomId).emit('answer', answer);
    console.log("the room id is chekcig now",roomId)
  });

  socket.on('candidate', (candidate, roomId) => {
    console.log('Received ICE candidate:', candidate);
    socket.to(roomId).emit('candidate', candidate);
    console.log("the room id is chekcig now",roomId)
  });

  socket.on("discount",()=>{
    console.log("Client disconnected", socket.id);
    for(const room in rooms){
      rooms[room] = rooms[room].filter((user)=>user.userId !== socket.id)
      if(rooms[room].length === 0){
        delete rooms[room];
        delete broadcasters[room]
      }else if(broadcasters[room] === socket.id){
        delete broadcasters[room]
      }
    }
  })
  })

  function getRoomId(userId1: string,userId2: string): string{
    return [userId1,userId2].sort().join('_')
  }

};

  // HANDILING WEBRTC SIGNALING MESSAGES





