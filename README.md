## RealTimeHub

This is a demo app for simulating and testing real-time, event-driven features powered by Socket.IO. It includes functionality like end-to-end encrypted private chatting and live classroom interactions.

## Goal

Would love for this project to become a collection of real-world implementations of real-time features — empowering beginners to learn freely and confidently.

## Warning

Please bear with me, I know the document is ugly, kinda busy 😄...

# CONTRIBUTIONS

You are free to fork, test and modify the code.

### CHAT Features

- e2e private chatting
- instant messaging
- user is typing broadcast
- message marked as saved
- message marked as read
- message marked as delivered

### Classroom Features

- join classroom
- leave classroom
- joined classrrom broadcast
- left classroom broadcast
- classroom broadcast

## NOTE

data value specified as {} means you should pass an object of any key-value pair you set.

to use the socket io pass auth option below to the io options

{
token: "logged-in-access-token"
}

## ERROR HANDLING

event name: "connect_error", // listen with io
parameter: err // check for the err.data response it contains more details

event name: "error-response", // listen with socket
parameter: error // error response

## CLASS ROOM EVENTS

class room events you can emit to server

event name: "join-class-room",
"argument": "channel-id", {} // key-value pair

event name: "class-room-broadcast",
argument: {} // key-value pair

event name: "leave-class-room",
argument: no argument

class room events you can listen to

event name: "joined-class-room",
parameter: {} // as passed from join-room event

event name: "left-class-room",
parameter: {} // as passed from join-room event

event name: "class-room-broadcast",
parameter: {} // as passed from room-broadcast event

## PRIVATE CHATS EVENTS

private chat events you can emit to server

event name: "join-chat-room",
argument: no argument

event name: "send-chat-message",
argument: {
sender: {
role: string,
id: string
},
receiver: {
role: string,
id: string
},
recipients: {}, // key value pair of encrypted e2e message
conversationId: string, // can be optional. New conversation will be created if a conversation id is not passed
tempId: string // client id to be used to track pending message
}

event name: "chat-message-read",
argument: "message-id"

event name: "chat-message-delivered",
argument: "message-id"

event name: "chat-user-typing",
argument: "receiver-id", {} // from user data

event name: "chat-user-stopped-typing",
argument: "receiver-id", {} // from user data

private chat events you can listen to

event name: "chat-message-read"
parameter: {} // message object

event name: "chat-message-delivered",
parameter: {} // message object

event name: "chat-user-typing",
parameter: {} // from user data

event name: "chat-user-stopped-typing",
parameter: {} // from user data

event name: "chat-message-saved"
parameter: {
tempId: string, // client id passed during send-chat-message event
message: {} // message object
}
