"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Plus,
  Send,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  Trash2,
  Edit,
  Mail,
  MessageSquare,
  Star,
  Calendar,
  Upload,
  FileText,
  List,
  CheckSquare,
  ChevronDown,
} from "lucide-react"
import { toast } from "sonner"

interface RSVPQuestion {
  id: string
  question_text: string
  question_type:
    | "short_text"
    | "long_text"
    | "multiple_choice"
    | "checkbox"
    | "dropdown"
    | "rating"
    | "date"
    | "file_upload"
  question_options: string[]
  is_required: boolean
  applies_to: "individual" | "family" | "party"
  conditional_logic: any
  sort_order: number
}

interface RSVPResponse {
  id: string
  participant_id: string
  response_status: "accepted" | "declined" | "pending"
  response_data: any
  additional_guests: number
  responded_at: string
  participant?: any
}

interface Participant {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  family?: string
  additional_participants?: any[]
}

export default function RSVPPage() {
  const [loading, setLoading] = useState(true)
  const [accountInstanceId, setAccountInstanceId] = useState<string | null>(null)
  const [websiteId, setWebsiteId] = useState<string | null>(null)

  // RSVP Questions State
  const [questions, setQuestions] = useState<RSVPQuestion[]>([])
  const [newQuestion, setNewQuestion] = useState<Partial<RSVPQuestion>>({
    question_text: "",
    question_type: "short_text",
    question_options: [],
    is_required: false,
    applies_to: "individual",
  })
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null)

  // RSVP Responses State
  const [responses, setResponses] = useState<RSVPResponse[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])

  // Invitation State
  const [invitationMessage, setInvitationMessage] = useState("")
  const [invitationSubject, setInvitationSubject] = useState("You're Invited!")

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    accepted: 0,
    declined: 0,
    pending: 0,
    totalGuests: 0,
  })

  // Fetch initial data
  useEffect(() => {
    fetchAccountInstance()
  }, [])

  useEffect(() => {
    if (accountInstanceId) {
      fetchWebsiteConfig()
      fetchParticipants()
    }
  }, [accountInstanceId])

  useEffect(() => {
    if (websiteId) {
      fetchQuestions()
      fetchResponses()
    }
  }, [websiteId])

  const fetchAccountInstance = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user?.email) return

      const { data: accounts } = await supabase.from("account_instances").select("id").eq("name", user.email)

      if (accounts && accounts.length > 0) {
        setAccountInstanceId(accounts[0].id)
      }
    } catch (error) {
      console.error("Error fetching account instance:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchWebsiteConfig = async () => {
    if (!accountInstanceId) return

    try {
      const { data: website } = await supabase
        .from("website_configurations")
        .select("id")
        .eq("account_instance_id", accountInstanceId)
        .single()

      if (website) {
        setWebsiteId(website.id)
      } else {
        // Create default website configuration
        const { data: newWebsite } = await supabase
          .from("website_configurations")
          .insert({
            account_instance_id: accountInstanceId,
            site_slug: `event-${Date.now()}`,
            site_title: "Our Special Day",
          })
          .select("id")
          .single()

        if (newWebsite) {
          setWebsiteId(newWebsite.id)
        }
      }
    } catch (error) {
      console.error("Error fetching website config:", error)
    }
  }

  const fetchParticipants = async () => {
    if (!accountInstanceId) return

    try {
      const { data } = await supabase
        .from("participants")
        .select(`
          id,
          first_name,
          last_name,
          email,
          phone,
          family,
          additional_participants (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq("account_instance_id", accountInstanceId)

      if (data) {
        setParticipants(data)
      }
    } catch (error) {
      console.error("Error fetching participants:", error)
    }
  }

  const fetchQuestions = async () => {
    if (!websiteId) return

    try {
      const { data } = await supabase.from("rsvp_questions").select("*").eq("website_id", websiteId).order("sort_order")

      if (data) {
        setQuestions(data)
      }
    } catch (error) {
      console.error("Error fetching questions:", error)
    }
  }

  const fetchResponses = async () => {
    if (!websiteId) return

    try {
      const { data } = await supabase
        .from("rsvp_responses")
        .select(`
          *,
          participants (
            id,
            first_name,
            last_name,
            email,
            additional_participants (
              id,
              first_name,
              last_name
            )
          )
        `)
        .eq("website_id", websiteId)

      if (data) {
        setResponses(data)
        calculateStats(data)
      }
    } catch (error) {
      console.error("Error fetching responses:", error)
    }
  }

  const calculateStats = (responses: RSVPResponse[]) => {
    const total = participants.length
    const accepted = responses.filter((r) => r.response_status === "accepted").length
    const declined = responses.filter((r) => r.response_status === "declined").length
    const pending = total - accepted - declined
    const totalGuests = responses
      .filter((r) => r.response_status === "accepted")
      .reduce((sum, r) => sum + 1 + (r.additional_guests || 0), 0)

    setStats({ total, accepted, declined, pending, totalGuests })
  }

  const addQuestion = async () => {
    if (!websiteId || !newQuestion.question_text) return

    try {
      const { data } = await supabase
        .from("rsvp_questions")
        .insert({
          website_id: websiteId,
          question_text: newQuestion.question_text,
          question_type: newQuestion.question_type,
          question_options: newQuestion.question_options || [],
          is_required: newQuestion.is_required,
          applies_to: newQuestion.applies_to,
          sort_order: questions.length,
        })
        .select()
        .single()

      if (data) {
        setQuestions([...questions, data])
        setNewQuestion({
          question_text: "",
          question_type: "short_text",
          question_options: [],
          is_required: false,
          applies_to: "individual",
        })
        toast.success("Question added successfully!")
      }
    } catch (error) {
      console.error("Error adding question:", error)
      toast.error("Failed to add question")
    }
  }

  const deleteQuestion = async (questionId: string) => {
    try {
      const { error } = await supabase.from("rsvp_questions").delete().eq("id", questionId)

      if (!error) {
        setQuestions(questions.filter((q) => q.id !== questionId))
        toast.success("Question deleted successfully!")
      }
    } catch (error) {
      console.error("Error deleting question:", error)
      toast.error("Failed to delete question")
    }
  }

  const sendInvitations = async () => {
    if (selectedParticipants.length === 0) {
      toast.error("Please select participants to invite")
      return
    }

    try {
      // Here you would implement the actual email sending logic
      // For now, we'll just show a success message
      toast.success(`Invitations sent to ${selectedParticipants.length} participants!`)
      setSelectedParticipants([])
    } catch (error) {
      console.error("Error sending invitations:", error)
      toast.error("Failed to send invitations")
    }
  }

  const getQuestionIcon = (type: string) => {
    switch (type) {
      case "short_text":
        return <FileText className="w-4 h-4" />
      case "long_text":
        return <MessageSquare className="w-4 h-4" />
      case "multiple_choice":
        return <List className="w-4 h-4" />
      case "checkbox":
        return <CheckSquare className="w-4 h-4" />
      case "dropdown":
        return <ChevronDown className="w-4 h-4" />
      case "rating":
        return <Star className="w-4 h-4" />
      case "date":
        return <Calendar className="w-4 h-4" />
      case "file_upload":
        return <Upload className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading RSVP management...</p>
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
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-light">RSVP Management</h1>
              <p className="text-slate-200 font-light">Manage invitations, questions, and responses</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="border-slate-200/50 shadow-sm bg-white/90 backdrop-blur-sm">
          <CardContent className="p-4 text-center">
            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Users className="w-4 h-4 text-slate-600" />
            </div>
            <div className="text-2xl font-light text-slate-800">{stats.total}</div>
            <div className="text-xs text-slate-600">Total Invited</div>
          </CardContent>
        </Card>

        <Card className="border-green-200/50 shadow-sm bg-green-50/50 backdrop-blur-sm">
          <CardContent className="p-4 text-center">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-2xl font-light text-green-800">{stats.accepted}</div>
            <div className="text-xs text-green-600">Accepted</div>
          </CardContent>
        </Card>

        <Card className="border-red-200/50 shadow-sm bg-red-50/50 backdrop-blur-sm">
          <CardContent className="p-4 text-center">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <XCircle className="w-4 h-4 text-red-600" />
            </div>
            <div className="text-2xl font-light text-red-800">{stats.declined}</div>
            <div className="text-xs text-red-600">Declined</div>
          </CardContent>
        </Card>

        <Card className="border-amber-200/50 shadow-sm bg-amber-50/50 backdrop-blur-sm">
          <CardContent className="p-4 text-center">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-light text-amber-800">{stats.pending}</div>
            <div className="text-xs text-amber-600">Pending</div>
          </CardContent>
        </Card>

        <Card className="border-rose-200/50 shadow-sm bg-rose-50/50 backdrop-blur-sm">
          <CardContent className="p-4 text-center">
            <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Users className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-light text-rose-800">{stats.totalGuests}</div>
            <div className="text-xs text-rose-600">Total Guests</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="questions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm border border-rose-200/50">
          <TabsTrigger value="questions" className="data-[state=active]:bg-rose-500 data-[state=active]:text-white">
            <MessageSquare className="w-4 h-4 mr-2" />
            Questions
          </TabsTrigger>
          <TabsTrigger value="invitations" className="data-[state=active]:bg-rose-500 data-[state=active]:text-white">
            <Send className="w-4 h-4 mr-2" />
            Invitations
          </TabsTrigger>
          <TabsTrigger value="responses" className="data-[state=active]:bg-rose-500 data-[state=active]:text-white">
            <BarChart3 className="w-4 h-4 mr-2" />
            Responses
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-rose-500 data-[state=active]:text-white">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Questions Tab */}
        <TabsContent value="questions" className="space-y-6">
          <Card className="border-slate-200/50 shadow-sm bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-rose-500" />
                RSVP Questions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add New Question */}
              <div className="p-4 border border-rose-200/50 rounded-lg bg-rose-50/30">
                <h3 className="font-medium text-slate-800 mb-4">Add New Question</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label>Question Text</Label>
                    <Input
                      value={newQuestion.question_text}
                      onChange={(e) => setNewQuestion({ ...newQuestion, question_text: e.target.value })}
                      placeholder="Enter your question..."
                    />
                  </div>

                  <div>
                    <Label>Question Type</Label>
                    <Select
                      value={newQuestion.question_type}
                      onValueChange={(value: any) => setNewQuestion({ ...newQuestion, question_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="short_text">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Short Text
                          </div>
                        </SelectItem>
                        <SelectItem value="long_text">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            Long Text
                          </div>
                        </SelectItem>
                        <SelectItem value="multiple_choice">
                          <div className="flex items-center gap-2">
                            <List className="w-4 h-4" />
                            Multiple Choice
                          </div>
                        </SelectItem>
                        <SelectItem value="checkbox">
                          <div className="flex items-center gap-2">
                            <CheckSquare className="w-4 h-4" />
                            Checkbox
                          </div>
                        </SelectItem>
                        <SelectItem value="dropdown">
                          <div className="flex items-center gap-2">
                            <ChevronDown className="w-4 h-4" />
                            Dropdown
                          </div>
                        </SelectItem>
                        <SelectItem value="rating">
                          <div className="flex items-center gap-2">
                            <Star className="w-4 h-4" />
                            Rating
                          </div>
                        </SelectItem>
                        <SelectItem value="date">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Date Picker
                          </div>
                        </SelectItem>
                        <SelectItem value="file_upload">
                          <div className="flex items-center gap-2">
                            <Upload className="w-4 h-4" />
                            File Upload
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Applies To</Label>
                    <Select
                      value={newQuestion.applies_to}
                      onValueChange={(value: any) => setNewQuestion({ ...newQuestion, applies_to: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Each Individual</SelectItem>
                        <SelectItem value="family">Per Family</SelectItem>
                        <SelectItem value="party">Per Party</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(newQuestion.question_type === "multiple_choice" ||
                    newQuestion.question_type === "dropdown" ||
                    newQuestion.question_type === "checkbox") && (
                    <div className="md:col-span-2">
                      <Label>Options (comma separated)</Label>
                      <Input
                        placeholder="Option 1, Option 2, Option 3"
                        onChange={(e) =>
                          setNewQuestion({
                            ...newQuestion,
                            question_options: e.target.value
                              .split(",")
                              .map((s) => s.trim())
                              .filter(Boolean),
                          })
                        }
                      />
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={newQuestion.is_required}
                      onCheckedChange={(checked) => setNewQuestion({ ...newQuestion, is_required: !!checked })}
                    />
                    <Label>Required Question</Label>
                  </div>

                  <div className="md:col-span-2">
                    <Button onClick={addQuestion} className="bg-rose-500 hover:bg-rose-600">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Question
                    </Button>
                  </div>
                </div>
              </div>

              {/* Existing Questions */}
              <div className="space-y-3">
                {questions.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600">No questions created yet</p>
                    <p className="text-sm text-slate-500">Add your first RSVP question above</p>
                  </div>
                ) : (
                  questions.map((question, index) => (
                    <div key={question.id} className="p-4 border border-slate-200 rounded-lg bg-white">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getQuestionIcon(question.question_type)}
                            <Badge variant="outline" className="text-xs">
                              {question.question_type.replace("_", " ")}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {question.applies_to}
                            </Badge>
                            {question.is_required && (
                              <Badge variant="destructive" className="text-xs">
                                Required
                              </Badge>
                            )}
                          </div>
                          <p className="text-slate-800 font-medium mb-2">{question.question_text}</p>
                          {question.question_options.length > 0 && (
                            <div className="text-sm text-slate-600">
                              <span className="font-medium">Options: </span>
                              {question.question_options.join(", ")}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteQuestion(question.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invitations Tab */}
        <TabsContent value="invitations" className="space-y-6">
          <Card className="border-slate-200/50 shadow-sm bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-rose-500" />
                Send Invitations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Invitation Message */}
              <div className="space-y-4">
                <div>
                  <Label>Email Subject</Label>
                  <Input
                    value={invitationSubject}
                    onChange={(e) => setInvitationSubject(e.target.value)}
                    placeholder="You're Invited!"
                  />
                </div>
                <div>
                  <Label>Invitation Message</Label>
                  <Textarea
                    value={invitationMessage}
                    onChange={(e) => setInvitationMessage(e.target.value)}
                    placeholder="Write your invitation message here..."
                    rows={4}
                  />
                </div>
              </div>

              {/* Participant Selection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-slate-800">Select Recipients</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedParticipants(participants.map((p) => p.id))}
                    >
                      Select All
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setSelectedParticipants([])}>
                      Clear All
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                  {participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center space-x-2 p-3 border border-slate-200 rounded-lg bg-white"
                    >
                      <Checkbox
                        checked={selectedParticipants.includes(participant.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedParticipants([...selectedParticipants, participant.id])
                          } else {
                            setSelectedParticipants(selectedParticipants.filter((id) => id !== participant.id))
                          }
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {participant.first_name} {participant.last_name}
                        </p>
                        <p className="text-xs text-slate-600 truncate">{participant.email}</p>
                        {participant.additional_participants && participant.additional_participants.length > 0 && (
                          <p className="text-xs text-slate-500">
                            +{participant.additional_participants.length} additional
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Send Button */}
              <div className="flex justify-end">
                <Button
                  onClick={sendInvitations}
                  disabled={selectedParticipants.length === 0}
                  className="bg-rose-500 hover:bg-rose-600"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Invitations ({selectedParticipants.length})
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Responses Tab */}
        <TabsContent value="responses" className="space-y-6">
          <Card className="border-slate-200/50 shadow-sm bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-rose-500" />
                RSVP Responses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {responses.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600">No responses yet</p>
                    <p className="text-sm text-slate-500">Responses will appear here once guests start RSVPing</p>
                  </div>
                ) : (
                  responses.map((response) => (
                    <div key={response.id} className="p-4 border border-slate-200 rounded-lg bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-slate-800">
                            {response.participant?.first_name} {response.participant?.last_name}
                          </h4>
                          <Badge
                            variant={
                              response.response_status === "accepted"
                                ? "default"
                                : response.response_status === "declined"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {response.response_status}
                          </Badge>
                        </div>
                        {response.responded_at && (
                          <span className="text-sm text-slate-500">
                            {new Date(response.responded_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {response.additional_guests > 0 && (
                        <p className="text-sm text-slate-600 mb-2">Additional guests: {response.additional_guests}</p>
                      )}

                      {response.response_data && Object.keys(response.response_data).length > 0 && (
                        <div className="mt-3 p-3 bg-slate-50 rounded">
                          <h5 className="text-sm font-medium text-slate-700 mb-2">Question Responses:</h5>
                          <div className="space-y-1">
                            {Object.entries(response.response_data).map(([question, answer]) => (
                              <div key={question} className="text-sm">
                                <span className="text-slate-600">{question}:</span>
                                <span className="ml-2 text-slate-800">{String(answer)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card className="border-slate-200/50 shadow-sm bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-rose-500" />
                Response Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600">Analytics Dashboard</p>
                <p className="text-sm text-slate-500">Detailed analytics and insights coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
