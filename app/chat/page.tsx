"use client"

import { useState, useEffect, useRef } from "react"
import { createClientSupabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import {
  Plus,
  Send,
  Paperclip,
  Smile,
  Users,
  MessageCircle,
  Phone,
  Mail,
  UserPlus,
  UserMinus,
  EyeOff,
  Loader2,
  AtSign,
} from "lucide-react"

interface ChatRoom {
  id: string
  name: string
  description: string
  event_id: string
  event_name?: string
  participants: ChatParticipant[]
  last_message?: ChatMessage
  unread_count: number
  created_at: string
}

interface ChatParticipant {
  id: string
  chat_room_id: string
  participant_type: "user" | "vendor_contact"
  display_name: string
  email: string
  phone?: string
  is_admin: boolean
  is_online: boolean
  joined_at: string
}

interface ChatMessage {
  id: string
  chat_room_id: string
  participant_id: string
  participant_name: string
  message_text: string
  message_html?: string
  attachments: any[]
  is_anonymous: boolean
  tagged_participants: string[]
  created_at: string
  edited_at?: string
}

interface VendorContact {
  id: string
  vendor_id: string
  vendor_name: string
  name: string
  email: string
  phone: string
  role: string
  is_primary: boolean
}

export default function ChatPage() {
  const [loading, setLoading] = useState(true)
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [vendorContacts, setVendorContacts] = useState<VendorContact[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [showCreateRoomDialog, setShowCreateRoomDialog] = useState(false)
  const [showAddParticipantDialog, setShowAddParticipantDialog] = useState(false)
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const supabase = createClientSupabase()

  const [newRoom, setNewRoom] = useState({
    name: "",
    description: "",
    event_id: ""
  })

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Get current user and account instance
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Mock data for demonstration
      const mockVendorContacts: VendorContact[] = [
        {
          id: "1",
          vendor_id: "1",
          vendor_name: "Elite Catering",
          name: "Sarah Johnson",
          email: "sarah@elitecatering.com",
          phone: "+1-555-0123",
          role: "Event Coordinator",
          is_primary: true
        },
        {
          id: "2",
          vendor_id: "2",
          vendor_name: "Perfect Flowers",
          name: "Mike Chen",
          email: "mike@perfectflowers.com",
          phone: "+1-555-0124",
          role: "Floral Designer",
          is_primary: true
        },
        {
          id: "3",
          vendor_id: "3",
          vendor_name: "Premium Photography",
          name: "Lisa Davis",
          email: "lisa@premiumphotography.com",
          phone: "+1-555-0125",
          role: "Lead Photographer",
          is_primary: true
        }
      ]

      const mockChatRooms: ChatRoom[] = [
        {
          id: "1",
          name: "Johnson Wedding Coordination",
          description: "Main coordination chat for Johnson wedding",
          event_id: "1",
          event_name: "Johnson Wedding",
          participants: [
            {
              id: "1",
              chat_room_id: "1",
              participant_type: "vendor_contact",
              display_name: "Sarah Johnson (Elite Catering)",
              email: "sarah@elitecatering.com",
              phone: "+1-555-0123",
              is_admin: false,
              is_online: true,
              joined_at: "2024-01-10T10:00:00Z"
            },
            {
              id: "2",
              chat_room_id: "1",
              participant_type: "vendor_contact",
              display_name: "Mike Chen (Perfect Flowers)",
              email: "mike@perfectflowers.com",
              phone: "+1-555-0124",
              is_admin: false,
              is_online: false,
              joined_at: "2024-01-10T10:00:00Z"
            }
          ],
          last_message: {
            id: "1",
            chat_room_id: "1",
            participant_id: "1",
            participant_name: "Sarah Johnson",
            message_text: "The catering setup will be ready by 4 PM",
            attachments: [],
            is_anonymous: false,
            tagged_participants: [],
            created_at: "2024-01-15T14:30:00Z"
          },
          unread_count: 2,
          created_at: "2024-01-10T10:00:00Z"
        }
      ]

      const mockMessages: ChatMessage[] = [
        {
          id: "1",
          chat_room_id: "1",
          participant_id: "1",
          participant_name: "Sarah Johnson",
          message_text: "Hi everyone! I wanted to confirm the setup timeline for the Johnson wedding.",
          attachments: [],
          is_anonymous: false,
          tagged_participants: [],
          created_at: "2024-01-15T10:00:00Z"
        },
        {
          id: "2",
          chat_room_id: "1",
          participant_id: "2",
          participant_name: "Mike Chen",
          message_text: "Perfect! I'll have the floral arrangements delivered by 2 PM. @Sarah Johnson, will the tables be ready by then?",
          attachments: [],
          is_anonymous: false,
          tagged_participants: ["1"],
          created_at: "2024-01-15T10:15:00Z"
        },
        {
          id: "3",
          chat_room_id: "1",
          participant_id: "1",
          participant_name: "Anonymous",
          message_text: "Yes, all tables will be set up by 1:30 PM. The catering setup will be ready by 4 PM.",
          attachments: [],
          is_anonymous: true,
          tagged_participants: [],
          created_at: "2024-01-15T14:30:00Z"
        }
      ]

      const mockEvents = [
        { id: "1", title: "Johnson Wedding", date: "2024-02-14" },
        { id: "2", title: "Corporate Gala", date: "2024-03-15" }
      ]

      setVendorContacts(mockVendorContacts)
      setChatRooms(mockChatRooms)
      setEvents(mockEvents)
      
      if (mockChatRooms.length > 0) {
        setSelectedRoom(mockChatRooms[0])
        setMessages(mockMessages.filter(m => m.chat_room_id === mockChatRooms[0].id))
      }

    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Failed to load chat data")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRoom = async () => {
    try {
      const room: ChatRoom = {
        id: Date.now().toString(),
        ...newRoom,
        event_name: events.find(e => e.id === newRoom.event_id)?.title,
        participants: [],
        unread_count: 0,
        created_at: new Date().toISOString()
      }
      
      setChatRooms([...chatRooms, room])
      toast.success("Chat room created successfully")
      
      setShowCreateRoomDialog(false)
      setNewRoom({
        name: "",
        description: "",
        event_id: ""
      })
    } catch (error) {
      toast.error("Failed to create chat room")
    }
  }

  const handleAddParticipants = async () => {
    try {
      if (!selectedRoom || selectedContacts.length === 0) return

      const newParticipants = selectedContacts.map(contactId => {
        const contact = vendorContacts.find(c => c.id === contactId)
        if (!contact) return null

        return {
          id: Date.now().toString() + contactId,
          chat_room_id: selectedRoom.id,
          participant_type: "vendor_contact" as const,
          display_name: `${contact.name} (${contact.vendor_name})`,
          email: contact.email,
          phone: contact.phone,
          is_admin: false,
          is_online: Math.random() > 0.5,
          joined_at: new Date().toISOString()
        }
      }).filter(Boolean) as ChatParticipant[]

      const updatedRooms = chatRooms.map(room => {
        if (room.id === selectedRoom.id) {
          return {
            ...room,
            participants: [...room.participants, ...newParticipants]
          }
        }
        return room
      })

      setChatRooms(updatedRooms)
      setSelectedRoom({
        ...selectedRoom,
        participants: [...selectedRoom.participants, ...newParticipants]
      })

      toast.success(`Added ${newParticipants.length} participants to the chat`)
      
      setShowAddParticipantDialog(false)
      setSelectedContacts([])
    } catch (error) {
      toast.error("Failed to add participants")
    }
  }

  const handleSendMessage = async () => {
    try {
      if (!selectedRoom || !newMessage.trim()) return

      const message: ChatMessage = {
        id: Date.now().toString(),
        chat_room_id: selectedRoom.id,
        participant_id: "current_user",
        participant_name: isAnonymous ? "Anonymous" : "You",
        message_text: newMessage,
        attachments: [],
        is_anonymous: isAnonymous,
        tagged_participants: [],
        created_at: new Date().toISOString()
      }

      setMessages([...messages, message])
      setNewMessage("")
      
      // Update last message in room
      const updatedRooms = chatRooms.map(room => {
        if (room.id === selectedRoom.id) {
          return {
            ...room,
            last_message: message
          }
        }
        return room
      })
      setChatRooms(updatedRooms)

      toast.success("Message sent")
    } catch (error) {
      toast.error("Failed to send message")
    }
  }

  const handleRemoveParticipant = async (participantId: string) => {
    try {
      if (!selectedRoom) return

      const updatedRooms = chatRooms.map(room => {
        if (room.id === selectedRoom.id) {
          return {
            ...room,
            participants: room.participants.filter(p => p.id !== participantId)
          }
        }
        return room
      })

      setChatRooms(updatedRooms)
      setSelectedRoom({
        ...selectedRoom,
        participants: selectedRoom.participants.filter(p => p.id !== participantId)
      })

      toast.success("Participant removed from chat")
    } catch (error) {
      toast.error("Failed to remove participant")
    }
  }

  const formatMessageTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatMessageDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading chat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Banner Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 text-white shadow-2xl mb-0">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/20 via-transparent to-amber-500/20"></div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-light">Vendor Chat</h1>
              <p className="text-slate-200 font-light">Collaborate with vendors in real-time</p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Chat Room Button */}
      <div className="flex justify-end">
        <Dialog open={showCreateRoomDialog} onOpenChange={setShowCreateRoomDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Chat Room
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Chat Room</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="room_name">Room Name</Label>
                <Input
                  id="room_name"
                  value={newRoom.name}
                  onChange={(e) => setNewRoom({...newRoom, name: e.target.value})}
                  placeholder="e.g., Johnson Wedding Coordination"
                />
              </div>
              <div>
                <Label htmlFor="room_description">Description</Label>
                <Textarea
                  id="room_description"
                  value={newRoom.description}
                  onChange={(e) => setNewRoom({...newRoom, description: e.target.value})}
                  placeholder="Brief description of the chat purpose..."
                />
              </div>
              <div>
                <Label htmlFor="room_event">Event</Label>
                <Select value={newRoom.event_id} onValueChange={(value) => setNewRoom({...newRoom, event_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select event" />
                  </SelectTrigger>
                  <SelectContent>
                    {events.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.title} - {event.date}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateRoomDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateRoom}>
                  Create Room
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
        {/* Chat Rooms Sidebar */}
        <div className="col-span-4">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Chat Rooms
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-300px)]">
                <div className="space-y-2 p-4">
                  {chatRooms.map((room) => (
                    <div
                      key={room.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedRoom?.id === room.id
                          ? "bg-primary/10 border-primary"
                          : "bg-white hover:bg-gray-50 border-gray-200"
                      }`}
                      onClick={() => {
                        setSelectedRoom(room)
                        setMessages(messages.filter(m => m.chat_room_id === room.id))
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-sm truncate">{room.name}</h3>
                            {room.unread_count > 0 && (
                              <Badge className="bg-red-500 text-white text-xs">
                                {room.unread_count}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {room.event_name}
                          </p>
                          {room.last_message && (
                            <p className="text-xs text-muted-foreground truncate mt-1">
                              {room.last_message.participant_name}: {room.last_message.message_text}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {room.participants.length}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Main Chat Area */}
        <div className="col-span-8">
          {selectedRoom ? (
            <Card className="h-full flex flex-col">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{selectedRoom.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{selectedRoom.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Dialog open={showAddParticipantDialog} onOpenChange={setShowAddParticipantDialog}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <UserPlus className="w-4 h-4 mr-2" />
                          Add Participants
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Add Participants</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Select Vendor Contacts</Label>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                              {vendorContacts
                                .filter(contact => !selectedRoom.participants.some(p => p.email === contact.email))
                                .map((contact) => (
                                <div key={contact.id} className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id={contact.id}
                                    checked={selectedContacts.includes(contact.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedContacts([...selectedContacts, contact.id])
                                      } else {
                                        setSelectedContacts(selectedContacts.filter(id => id !== contact.id))
                                      }
                                    }}
                                  />
                                  <Label htmlFor={contact.id} className="flex-1 cursor-pointer">
                                    <div>
                                      <div className="font-medium">{contact.name}</div>
                                      <div className="text-sm text-muted-foreground">
                                        {contact.vendor_name} - {contact.role}
                                      </div>
                                    </div>
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowAddParticipantDialog(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleAddParticipants} disabled={selectedContacts.length === 0}>
                              Add {selectedContacts.length} Participants
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Badge variant="outline">
                      {selectedRoom.participants.length} participants
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              {/* Participants List */}
              <div className="border-b p-4">
                <div className="flex flex-wrap gap-2">
                  {selectedRoom.participants.map((participant) => (
                    <div key={participant.id} className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${participant.is_online ? 'bg-green-500' : 'bg-gray-400'}`} />
                        <span className="text-sm">{participant.display_name}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-4 w-4 p-0 hover:bg-red-100"
                        onClick={() => handleRemoveParticipant(participant.id)}
                      >
                        <UserMinus className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Messages Area */}
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-[calc(100vh-500px)] p-4">
                  <div className="space-y-4">
                    {messages.map((message, index) => {
                      const showDate = index === 0 || 
                        formatMessageDate(message.created_at) !== formatMessageDate(messages[index - 1].created_at)
                      
                      return (
                        <div key={message.id}>
                          {showDate && (
                            <div className="text-center text-xs text-muted-foreground py-2">
                              {formatMessageDate(message.created_at)}
                            </div>
                          )}
                          <div className={`flex gap-3 ${message.participant_name === "You" ? "justify-end" : ""}`}>
                            {message.participant_name !== "You" && (
                              <Avatar className="w-8 h-8">
                                <AvatarFallback className="text-xs">
                                  {message.is_anonymous ? "?" : message.participant_name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div className={`max-w-[70%] ${message.participant_name === "You" ? "order-first" : ""}`}>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium">
                                  {message.is_anonymous ? "Anonymous" : message.participant_name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatMessageTime(message.created_at)}
                                </span>
                                {message.is_anonymous && (
                                  <EyeOff className="w-3 h-3 text-muted-foreground" />
                                )}
                              </div>
                              <div className={`p-3 rounded-lg ${
                                message.participant_name === "You" 
                                  ? "bg-primary text-primary-foreground" 
                                  : "bg-gray-100"
                              }`}>
                                <p className="text-sm">{message.message_text}</p>
                                {message.tagged_participants.length > 0 && (
                                  <div className="mt-2 flex items-center gap-1">
                                    <AtSign className="w-3 h-3" />
                                    <span className="text-xs opacity-75">Tagged participants</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            {message.participant_name === "You" && (
                              <Avatar className="w-8 h-8">
                                <AvatarFallback className="text-xs">You</AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </CardContent>

              {/* Message Input */}
              <div className="border-t p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="anonymous"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                    />
                    <Label htmlFor="anonymous" className="text-sm">Send anonymously</Label>
                  </div>
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="min-h-[60px] resize-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button size="sm" variant="outline">
                      <Paperclip className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Smile className="w-4 h-4" />
                    </Button>
                    <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Select a Chat Room</h3>
                <p className="text-muted-foreground">
                  Choose a chat room from the sidebar to start collaborating with vendors
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>

      <Tabs defaultValue="email" className="mt-6">
        <TabsList>
          <TabsTrigger value="email">Email Notifications</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp Integration</TabsTrigger>
          <TabsTrigger value="sms">SMS Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Email Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">New Message Notifications</h4>
                    <p className="text-sm text-muted-foreground">
                      Receive email notifications when new messages are posted
                    </p>
                  </div>
                  <input type="checkbox" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Daily Summary</h4>
                    <p className="text-sm text-muted-foreground">
                      Get a daily summary of chat activity
                    </p>
                  </div>
                  <input type="checkbox" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="whatsapp" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                WhatsApp Integration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Phone className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">WhatsApp Integration</h3>
                <p className="text-muted-foreground mb-4">
                  Connect your WhatsApp to enable cross-platform vendor collaboration
                </p>
                <Button variant="outline" disabled>
                  Connect WhatsApp (Coming Soon)
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                SMS Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Phone className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">SMS Integration</h3>
                <p className="text-muted-foreground mb-4">
                  SMS notifications will be available in a future update
                </p>
                <Button variant="outline" disabled>
                  SMS Integration (Coming Soon)
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
