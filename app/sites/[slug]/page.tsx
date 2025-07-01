"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Heart, Calendar, MapPin, Clock, Lock } from "lucide-react"
import { toast } from "sonner"

interface WebsiteData {
  id: string
  site_title: string
  site_subtitle: string
  theme_id: string
  color_scheme: {
    primary: string
    secondary: string
    accent: string
    background: string
    text: string
  }
  is_password_protected: boolean
  site_password?: string
  pages: any[]
  components: any[]
}

interface RSVPFormData {
  response_status: "accepted" | "declined"
  additional_guests: number
  dietary_restrictions: string
  special_requests: string
  responses: { [key: string]: any }
}

export default function PublicWebsitePage() {
  const params = useParams()
  const slug = params.slug as string

  const [loading, setLoading] = useState(true)
  const [websiteData, setWebsiteData] = useState<WebsiteData | null>(null)
  const [isPasswordRequired, setIsPasswordRequired] = useState(false)
  const [password, setPassword] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentPage, setCurrentPage] = useState("home")

  // RSVP State
  const [showRSVP, setShowRSVP] = useState(false)
  const [rsvpData, setRsvpData] = useState<RSVPFormData>({
    response_status: "accepted",
    additional_guests: 0,
    dietary_restrictions: "",
    special_requests: "",
    responses: {},
  })
  const [rsvpQuestions, setRsvpQuestions] = useState<any[]>([])

  // Animation State
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (slug) {
      fetchWebsiteData()
    }
  }, [slug])

  useEffect(() => {
    // Trigger loading animation
    const timer = setTimeout(() => setIsLoaded(true), 500)
    return () => clearTimeout(timer)
  }, [])

  const fetchWebsiteData = async () => {
    try {
      const { data: website } = await supabase
        .from("website_configurations")
        .select(`
          *,
          website_pages (*),
          website_components (*),
          rsvp_questions (*)
        `)
        .eq("site_slug", slug)
        .eq("is_published", true)
        .single()

      if (website) {
        setWebsiteData(website)
        setRsvpQuestions(website.rsvp_questions || [])

        if (website.is_password_protected) {
          setIsPasswordRequired(true)
        } else {
          setIsAuthenticated(true)
        }
      }
    } catch (error) {
      console.error("Error fetching website:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = () => {
    if (password === websiteData?.site_password) {
      setIsAuthenticated(true)
      setIsPasswordRequired(false)
    } else {
      toast.error("Incorrect password")
    }
  }

  const submitRSVP = async () => {
    try {
      // Here you would submit the RSVP data to your database
      // For now, we'll just show a success message
      toast.success("RSVP submitted successfully!")
      setShowRSVP(false)
    } catch (error) {
      console.error("Error submitting RSVP:", error)
      toast.error("Failed to submit RSVP")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-amber-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your special day...</p>
        </div>
      </div>
    )
  }

  if (!websiteData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-light text-slate-800 mb-4">Website Not Found</h1>
            <p className="text-slate-600">The website you're looking for doesn't exist or has been unpublished.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isPasswordRequired && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-amber-50">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <Lock className="w-12 h-12 text-rose-500 mx-auto mb-4" />
              <h1 className="text-2xl font-light text-slate-800 mb-2">Password Protected</h1>
              <p className="text-slate-600">Please enter the password to view this website</p>
            </div>
            <div className="space-y-4">
              <div>
                <Label>Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  onKeyPress={(e) => e.key === "Enter" && handlePasswordSubmit()}
                />
              </div>
              <Button onClick={handlePasswordSubmit} className="w-full bg-rose-500 hover:bg-rose-600">
                Enter Website
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { color_scheme } = websiteData

  return (
    <div
      className={`min-h-screen transition-all duration-1000 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      style={{ backgroundColor: color_scheme.background }}
    >
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-light" style={{ color: color_scheme.text }}>
              {websiteData.site_title}
            </h1>
            <div className="flex items-center gap-6">
              {websiteData.pages.map((page) => (
                <button
                  key={page.id}
                  onClick={() => setCurrentPage(page.page_slug)}
                  className={`text-sm font-medium transition-colors ${
                    currentPage === page.page_slug ? "text-rose-600" : "text-slate-600 hover:text-slate-800"
                  }`}
                >
                  {page.page_title}
                </button>
              ))}
              <Button
                onClick={() => setShowRSVP(true)}
                size="sm"
                style={{ backgroundColor: color_scheme.primary }}
                className="text-white hover:opacity-90"
              >
                RSVP
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        className="relative h-screen flex items-center justify-center text-white"
        style={{
          background: `linear-gradient(135deg, ${color_scheme.primary}, ${color_scheme.secondary})`,
        }}
      >
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative text-center z-10 max-w-4xl mx-auto px-4">
          <div className="animate-fade-in">
            <h1 className="text-6xl md:text-8xl font-light mb-6 tracking-wide">{websiteData.site_title}</h1>
            <p className="text-xl md:text-2xl font-light opacity-90 mb-8">{websiteData.site_subtitle}</p>

            {/* Countdown Timer */}
            <div className="flex items-center justify-center gap-8 mb-8">
              {[
                { label: "Days", value: "120" },
                { label: "Hours", value: "15" },
                { label: "Minutes", value: "30" },
                { label: "Seconds", value: "45" },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <div className="text-3xl md:text-4xl font-light">{item.value}</div>
                  <div className="text-sm opacity-75">{item.label}</div>
                </div>
              ))}
            </div>

            <Button
              onClick={() => setShowRSVP(true)}
              size="lg"
              className="bg-white text-slate-800 hover:bg-slate-100 px-8 py-4 text-lg"
            >
              <Heart className="w-5 h-5 mr-2" />
              RSVP Now
            </Button>
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <div className="max-w-6xl mx-auto px-4 py-16 space-y-16">
        {/* Our Story */}
        <section className="text-center">
          <h2 className="text-4xl font-light mb-8" style={{ color: color_scheme.text }}>
            Our Story
          </h2>
          <div className="max-w-3xl mx-auto">
            <p className="text-lg leading-relaxed text-slate-600 mb-8">
              Every love story is beautiful, but ours is our favorite. From our first meeting to this special day, we've
              shared countless memories and adventures. We can't wait to celebrate with all of you and begin this new
              chapter of our lives together.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-6 rounded-lg" style={{ backgroundColor: `${color_scheme.primary}10` }}>
                <h3 className="text-xl font-medium mb-4" style={{ color: color_scheme.text }}>
                  How We Met
                </h3>
                <p className="text-slate-600">
                  Our paths crossed on a beautiful spring day, and we knew from that moment that something special was
                  beginning.
                </p>
              </div>
              <div className="p-6 rounded-lg" style={{ backgroundColor: `${color_scheme.secondary}10` }}>
                <h3 className="text-xl font-medium mb-4" style={{ color: color_scheme.text }}>
                  The Proposal
                </h3>
                <p className="text-slate-600">
                  Under the stars on our favorite beach, with the sound of waves in the background, the question was
                  finally asked.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Event Details */}
        <section>
          <h2 className="text-4xl font-light text-center mb-12" style={{ color: color_scheme.text }}>
            Event Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center p-8">
              <CardContent>
                <Calendar className="w-12 h-12 mx-auto mb-4" style={{ color: color_scheme.primary }} />
                <h3 className="text-xl font-medium mb-2">Date</h3>
                <p className="text-slate-600">Saturday, June 15th, 2024</p>
              </CardContent>
            </Card>
            <Card className="text-center p-8">
              <CardContent>
                <Clock className="w-12 h-12 mx-auto mb-4" style={{ color: color_scheme.primary }} />
                <h3 className="text-xl font-medium mb-2">Time</h3>
                <p className="text-slate-600">4:00 PM - 11:00 PM</p>
              </CardContent>
            </Card>
            <Card className="text-center p-8">
              <CardContent>
                <MapPin className="w-12 h-12 mx-auto mb-4" style={{ color: color_scheme.primary }} />
                <h3 className="text-xl font-medium mb-2">Venue</h3>
                <p className="text-slate-600">
                  Beautiful Garden Venue
                  <br />
                  123 Love Lane, Romance City
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Photo Gallery Preview */}
        <section>
          <h2 className="text-4xl font-light text-center mb-12" style={{ color: color_scheme.text }}>
            Our Memories
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="aspect-square bg-slate-200 rounded-lg overflow-hidden">
                <img
                  src={`/placeholder.svg?height=300&width=300&text=Photo ${i}`}
                  alt={`Memory ${i}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* RSVP Modal */}
      {showRSVP && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-light mb-2" style={{ color: color_scheme.text }}>
                  RSVP
                </h2>
                <p className="text-slate-600">Please let us know if you'll be joining us</p>
              </div>

              <div className="space-y-6">
                {/* Response Status */}
                <div>
                  <Label className="text-lg font-medium">Will you be attending?</Label>
                  <div className="flex gap-4 mt-2">
                    <Button
                      variant={rsvpData.response_status === "accepted" ? "default" : "outline"}
                      onClick={() => setRsvpData((prev) => ({ ...prev, response_status: "accepted" }))}
                      className="flex-1"
                    >
                      <Heart className="w-4 h-4 mr-2" />
                      Yes, I'll be there!
                    </Button>
                    <Button
                      variant={rsvpData.response_status === "declined" ? "default" : "outline"}
                      onClick={() => setRsvpData((prev) => ({ ...prev, response_status: "declined" }))}
                      className="flex-1"
                    >
                      Sorry, can't make it
                    </Button>
                  </div>
                </div>

                {rsvpData.response_status === "accepted" && (
                  <>
                    {/* Additional Guests */}
                    <div>
                      <Label>Number of additional guests</Label>
                      <Select
                        value={rsvpData.additional_guests.toString()}
                        onValueChange={(value) =>
                          setRsvpData((prev) => ({ ...prev, additional_guests: Number.parseInt(value) }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[0, 1, 2, 3, 4, 5].map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num === 0 ? "Just me" : `${num} additional guest${num > 1 ? "s" : ""}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Custom Questions */}
                    {rsvpQuestions.map((question) => (
                      <div key={question.id}>
                        <Label>
                          {question.question_text}
                          {question.is_required && <span className="text-red-500 ml-1">*</span>}
                        </Label>

                        {question.question_type === "short_text" && (
                          <Input
                            value={rsvpData.responses[question.id] || ""}
                            onChange={(e) =>
                              setRsvpData((prev) => ({
                                ...prev,
                                responses: { ...prev.responses, [question.id]: e.target.value },
                              }))
                            }
                          />
                        )}

                        {question.question_type === "long_text" && (
                          <Textarea
                            value={rsvpData.responses[question.id] || ""}
                            onChange={(e) =>
                              setRsvpData((prev) => ({
                                ...prev,
                                responses: { ...prev.responses, [question.id]: e.target.value },
                              }))
                            }
                            rows={3}
                          />
                        )}

                        {question.question_type === "multiple_choice" && (
                          <Select
                            value={rsvpData.responses[question.id] || ""}
                            onValueChange={(value) =>
                              setRsvpData((prev) => ({
                                ...prev,
                                responses: { ...prev.responses, [question.id]: value },
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select an option" />
                            </SelectTrigger>
                            <SelectContent>
                              {question.question_options.map((option: string) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    ))}

                    {/* Dietary Restrictions */}
                    <div>
                      <Label>Dietary restrictions or allergies</Label>
                      <Textarea
                        value={rsvpData.dietary_restrictions}
                        onChange={(e) => setRsvpData((prev) => ({ ...prev, dietary_restrictions: e.target.value }))}
                        placeholder="Please let us know about any dietary needs..."
                        rows={2}
                      />
                    </div>

                    {/* Special Requests */}
                    <div>
                      <Label>Special requests or messages</Label>
                      <Textarea
                        value={rsvpData.special_requests}
                        onChange={(e) => setRsvpData((prev) => ({ ...prev, special_requests: e.target.value }))}
                        placeholder="Any special requests or a message for the couple..."
                        rows={3}
                      />
                    </div>
                  </>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4 pt-6">
                  <Button variant="outline" onClick={() => setShowRSVP(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={submitRSVP} className="flex-1" style={{ backgroundColor: color_scheme.primary }}>
                    Submit RSVP
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
