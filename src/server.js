import dotenv from "dotenv";
dotenv.config();

import { app } from "./app.js";
import http from "http";
import {Server} from "socket.io";
import connectDB from "./DB/connect.db.js";
import {generateH3Cell} from "./Utils/userLocation.js";

const port = process.env.PORT ;
const server = http.createServer(app);
const io = new Server(server,{
    cors:{
        origin:"http://localhost:5173",
        methods:["GET","POST","PUT","DELETE"],
        credentials:true
    }
});

io.on("connection",(socket)=>{
    console.log("User connected",socket.id);
    socket.on("user:location",({latitude,longitude,id})=>{
        const joinString = generateH3Cell(latitude,longitude,8);
        if(socket.currentRoom !== joinString){
            const oldRoom = socket.currentRoom;
            if(oldRoom){
                socket.leave(oldRoom);
                
            }
            socket.join(joinString);
            socket.currentRoom = joinString;
        }
        else{
            console.log("User is in same room")
        }
    });
    socket.on("send_message",({message,id,timestamp})=>{
        console.log(socket.currentRoom)
        if(socket.currentRoom){
            io.to(socket.currentRoom).emit("recieve_message",{message,id,timestamp});
        }
        
    });
    socket.on("disconnect",()=>{
        if(socket.currentRoom){
            socket.leave(socket.currentRoom);
        }
    });
    
});

connectDB()
    .then(() => {
        server.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    })
    .catch((error) => {
        console.log("Error connecting to MongoDB:", error);
        process.exit(1);
    });
