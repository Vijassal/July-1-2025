"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Eye,
  Smartphone,
  Monitor,
  Settings,
  Plus,
  Share,
  QrCode,
  Timer,
  ImageIcon,
  Video,
  Type,
  MousePointer,
  Layers,
  Save,
  ExternalLink,
  Palette,
  Globe,
  Lock,
  Unlock,
} from "lucide-react"
import { toast } from "sonner"

interface WebsiteConfig {
  id: string
  site_slug: string
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
  layout_config: any
  is_published: boolean
  is_password_protected: boolean
  site_password?: string
}

interface WebsitePage {
  id: string
  page_slug: string
  page_title: string
  page_type: string
  content: any
  layout_config: any
  is_published: boolean
  sort_order: number
}

interface WebsiteComponent {
  id: string
  component_type: string
  component_name: string
  component_config: any
}

const THEMES = [
  {
    id: "classic",
    name: "Classic Elegance",
    preview: "/placeholder.svg?height=100&width=150&text=Classic",
    description: "Timeless and sophisticated",
  },
  {
    id: "modern",
    name: "Modern Minimalist",
    preview: "/placeholder.svg?height=100&width=150&text=Modern",
    description: "Clean and contemporary",
  },
  {
    id: "romantic",
    name: "Romantic Garden",
    preview: "/placeholder.svg?height=100&width=150&text=Romantic",
    description: "Soft and dreamy",
  },
  {
    id: "rustic",
    name: "Rustic Charm",
    preview: "/placeholder.svg?height=100&width=150&text=Rustic",
    description: "Natural and cozy",
  },
  {
    id: "luxury",
    name: "Luxury Gold",
    preview: "/placeholder.svg?height=100&width=150&text=Luxury",
    description: "Elegant and opulent",
  },
  {
    id: "beach",
    name: "Beach Vibes",
    preview: "/placeholder.svg?height=100&width=150&text=Beach",
    description: "Relaxed and coastal",
  },
]

const LAYOUT_TEMPLATES = [
  { id: "single-page", name: "Single Page", description: "Everything on one scrollable page" },
  { id: "multi-page", name: "Multi Page", description: "Separate pages for different sections" },
  { id: "timeline", name: "Timeline Style", description: "Story-based timeline layout" },
  { id: "gallery-focus", name: "Gallery Focus", description: "Photo-centric design" },
]

const COMPONENT_TYPES = [
  { type: "hero", name: "Hero Section", icon: ImageIcon, description: "Main banner with title and image" },
  { type: "countdown", name: "Countdown Timer", icon: Timer, description: "Days until your event" },
  { type: "gallery", name: "Photo Gallery", icon: ImageIcon, description: "Showcase your photos" },
  { type: "text", name: "Text Block", icon: Type, description: "Custom text content" },
  { type: "video", name: "Video Embed", icon: Video, description: "YouTube or Vimeo videos" },
  { type: "rsvp_form", name: "RSVP Form", icon: MousePointer, description: "Guest response form" },
]

export default function DesignPage() {
  const [loading, setLoading] = useState(true)
  const [accountInstanceId, setAccountInstanceId] = useState<string | null>(null)
  const [websiteConfig, setWebsiteConfig] = useState<WebsiteConfig | null>(null)
  const [pages, setPages] = useState<WebsitePage[]>([])
  const [components, setComponents] = useState<WebsiteComponent[]>([])

  // Design State
  const [selectedTheme, setSelectedTheme] = useState("classic")
  const [viewMode, setViewMode] = useState<"desktop" | "mobile" | "both">("both")
  const [designMode, setDesignMode] = useState<"simple" | "advanced">("simple")
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Color Customization
  const [colorScheme, setColorScheme] = useState({
    primary: "#e11d48",
    secondary: "#f59e0b",
    accent: "#8b5cf6",
    background: "#ffffff",
    text: "#1f2937",
  })

  // Site Settings
  const [siteSettings, setSiteSettings] = useState({
    title: "Our Special Day",
    subtitle: "Join us as we celebrate our love",
    slug: "",
    isPasswordProtected: false,
    password: "",
    isPublished: false,
  })

  // Preview State
  const [previewMode, setPreviewMode] = useState(false)
  const [selectedPage, setSelectedPage] = useState<string>("home")

  useEffect(() => {
    fetchAccountInstance()
  }, [])

  useEffect(() => {
    if (accountInstanceId) {
      fetchWebsiteConfig()
    }
  }, [accountInstanceId])

  const fetchAccountInstance = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user?.id) return

      const { data: account } = await supabase
        .from("account_instances")
        .select("id")
        .eq("owner_user_id", user.id)
        .single()

      if (account) {
        setAccountInstanceId(account.id)
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
        .select("*")
        .eq("account_instance_id", accountInstanceId)
        .single()

      if (website) {
        setWebsiteConfig(website)
        setSiteSettings({
          title: website.site_title || "Our Special Day",
          subtitle: website.site_subtitle || "Join us as we celebrate our love",
          slug: website.site_slug || "",
          isPasswordProtected: website.is_password_protected || false,
          password: website.site_password || "",
          isPublished: website.is_published || false,
        })
        setColorScheme(website.color_scheme || colorScheme)
        setSelectedTheme(website.theme_id || "classic")
      } else {
        // Create default website configuration
        await createDefaultWebsite()
      }

      // Fetch pages and components
      await fetchPages()
      await fetchComponents()
    } catch (error) {
      console.error("Error fetching website config:", error)
    }
  }

  const createDefaultWebsite = async () => {
    if (!accountInstanceId) return

    try {
      const defaultSlug = `event-${Date.now()}`
      const { data: newWebsite } = await supabase
        .from("website_configurations")
        .insert({
          account_instance_id: accountInstanceId,
          site_slug: defaultSlug,
          site_title: "Our Special Day",
          site_subtitle: "Join us as we celebrate our love",
          theme_id: "classic",
          color_scheme: colorScheme,
        })
        .select()
        .single()

      if (newWebsite) {
        setWebsiteConfig(newWebsite)
        setSiteSettings((prev) => ({ ...prev, slug: defaultSlug }))

        // Create default home page
        await supabase.from("website_pages").insert({
          website_id: newWebsite.id,
          page_slug: "home",
          page_title: "Home",
          page_type: "home",
          content: { sections: [] },
          sort_order: 0,
        })
      }
    } catch (error) {
      console.error("Error creating default website:", error)
    }
  }

  const fetchPages = async () => {
    if (!websiteConfig) return

    try {
      const { data } = await supabase
        .from("website_pages")
        .select("*")
        .eq("website_id", websiteConfig.id)
        .order("sort_order")

      if (data) {
        setPages(data)
      }
    } catch (error) {
      console.error("Error fetching pages:", error)
    }
  }

  const fetchComponents = async () => {
    if (!websiteConfig) return

    try {
      const { data } = await supabase.from("website_components").select("*").eq("website_id", websiteConfig.id)

      if (data) {
        setComponents(data)
      }
    } catch (error) {
      console.error("Error fetching components:", error)
    }
  }

  const saveWebsiteConfig = async () => {
    if (!websiteConfig) return

    try {
      const { error } = await supabase
        .from("website_configurations")
        .update({
          site_title: siteSettings.title,
          site_subtitle: siteSettings.subtitle,
          site_slug: siteSettings.slug,
          theme_id: selectedTheme,
          color_scheme: colorScheme,
          is_password_protected: siteSettings.isPasswordProtected,
          site_password: siteSettings.password,
          is_published: siteSettings.isPublished,
          updated_at: new Date().toISOString(),
        })
        .eq("id", websiteConfig.id)

      if (!error) {
        toast.success("Website settings saved!")
      }
    } catch (error) {
      console.error("Error saving website config:", error)
      toast.error("Failed to save settings")
    }
  }

  const generateQRCode = () => {
    const websiteUrl = `${window.location.origin}/sites/${siteSettings.slug}`
    // Here you would integrate with a QR code library
    toast.success("QR Code generated!")
  }

  const copyWebsiteLink = () => {
    const websiteUrl = `${window.location.origin}/sites/${siteSettings.slug}`
    navigator.clipboard.writeText(websiteUrl)
    toast.success("Website link copied to clipboard!")
  }

  const publishWebsite = async () => {
    try {
      await supabase.from("website_configurations").update({ is_published: true }).eq("id", websiteConfig?.id)

      setSiteSettings((prev) => ({ ...prev, isPublished: true }))
      toast.success("Website published successfully!")
    } catch (error) {
      console.error("Error publishing website:", error)
      toast.error("Failed to publish website")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading website designer...</p>
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
              <Palette className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-light">Website Designer</h1>
              <p className="text-slate-200 font-light">Create your beautiful event website</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" onClick={copyWebsiteLink}>
          <Share className="w-4 h-4 mr-2" />
          Share Link
        </Button>
        <Button variant="outline" onClick={generateQRCode}>
          <QrCode className="w-4 h-4 mr-2" />
          QR Code
        </Button>
        <Button
          onClick={publishWebsite}
          className="bg-rose-500 hover:bg-rose-600"
          disabled={siteSettings.isPublished}
        >
          <Globe className="w-4 h-4 mr-2" />
          {siteSettings.isPublished ? "Published" : "Publish Website"}
        </Button>
      </div>

      {/* Design Mode Toggle */}
      <Card className="border-slate-200/50 shadow-sm bg-white/90 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label>Design Mode:</Label>
                <Select value={designMode} onValueChange={(value: any) => setDesignMode(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simple">Simple</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Label>View:</Label>
                <div className="flex border rounded-lg">
                  <Button
                    variant={viewMode === "desktop" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("desktop")}
                  >
                    <Monitor className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "mobile" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("mobile")}
                  >
                    <Smartphone className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "both" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("both")}
                  >
                    Both
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant={previewMode ? "default" : "outline"} onClick={() => setPreviewMode(!previewMode)}>
                <Eye className="w-4 h-4 mr-2" />
                {previewMode ? "Exit Preview" : "Preview"}
              </Button>
              <Button onClick={saveWebsiteConfig} className="bg-rose-500 hover:bg-rose-600">
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {previewMode ? (
        /* Website Preview */
        <Card className="border-slate-200/50 shadow-lg bg-white">
          <CardContent className="p-0">
            <div className="bg-gradient-to-br from-slate-100 to-slate-200 p-8 min-h-[600px]">
              <div className="max-w-4xl mx-auto">
                {/* Preview Header */}
                <div className="text-center mb-8">
                  <div className="inline-block px-4 py-2 bg-rose-500 text-white rounded-full text-sm mb-4">
                    Preview Mode - {viewMode}
                  </div>
                  <h1 className="text-4xl font-light text-slate-800 mb-2">{siteSettings.title}</h1>
                  <p className="text-slate-600">{siteSettings.subtitle}</p>
                </div>

                {/* Sample Website Content */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div
                    className="h-64 bg-gradient-to-r flex items-center justify-center text-white"
                    style={{ backgroundColor: colorScheme.primary }}
                  >
                    <div className="text-center">
                      <h2 className="text-3xl font-light mb-2">Welcome to Our Website</h2>
                      <p className="text-lg opacity-90">This is a preview of your event website</p>
                    </div>
                  </div>

                  <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <h3 className="text-xl font-medium mb-4" style={{ color: colorScheme.text }}>
                          Our Story
                        </h3>
                        <p className="text-slate-600 leading-relaxed">
                          This is where your beautiful story would be displayed. You can customize every aspect of this
                          website to match your vision.
                        </p>
                      </div>
                      <div>
                        <h3 className="text-xl font-medium mb-4" style={{ color: colorScheme.text }}>
                          Event Details
                        </h3>
                        <div className="space-y-2 text-slate-600">
                          <p>📅 Date: Your Event Date</p>
                          <p>📍 Location: Your Venue</p>
                          <p>⏰ Time: Your Event Time</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 text-center">
                      <Button className="px-8 py-3" style={{ backgroundColor: colorScheme.secondary }}>
                        RSVP Now
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Design Interface */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Design Panel */}
          <div className="lg:col-span-1 space-y-6">
            <Tabs defaultValue="settings" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm border border-rose-200/50">
                <TabsTrigger
                  value="settings"
                  className="data-[state=active]:bg-rose-500 data-[state=active]:text-white"
                >
                  <Settings className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="themes" className="data-[state=active]:bg-rose-500 data-[state=active]:text-white">
                  <Palette className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="colors" className="data-[state=active]:bg-rose-500 data-[state=active]:text-white">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-r from-rose-400 to-amber-400"></div>
                </TabsTrigger>
                <TabsTrigger
                  value="components"
                  className="data-[state=active]:bg-rose-500 data-[state=active]:text-white"
                >
                  <Layers className="w-4 h-4" />
                </TabsTrigger>
              </TabsList>

              {/* Site Settings */}
              <TabsContent value="settings" className="space-y-4">
                <Card className="border-slate-200/50 shadow-sm bg-white/90 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Site Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Website Title</Label>
                      <Input
                        value={siteSettings.title}
                        onChange={(e) => setSiteSettings({ ...siteSettings, title: e.target.value })}
                        placeholder="Our Special Day"
                      />
                    </div>

                    <div>
                      <Label>Subtitle</Label>
                      <Input
                        value={siteSettings.subtitle}
                        onChange={(e) => setSiteSettings({ ...siteSettings, subtitle: e.target.value })}
                        placeholder="Join us as we celebrate our love"
                      />
                    </div>

                    <div>
                      <Label>Website URL</Label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-300 bg-slate-50 text-slate-500 text-sm">
                          /sites/
                        </span>
                        <Input
                          value={siteSettings.slug}
                          onChange={(e) => setSiteSettings({ ...siteSettings, slug: e.target.value })}
                          className="rounded-l-none"
                          placeholder="your-event-name"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={siteSettings.isPasswordProtected}
                        onCheckedChange={(checked) =>
                          setSiteSettings({ ...siteSettings, isPasswordProtected: !!checked })
                        }
                      />
                      <Label>Password protect website</Label>
                    </div>

                    {siteSettings.isPasswordProtected && (
                      <div>
                        <Label>Password</Label>
                        <Input
                          type="password"
                          value={siteSettings.password}
                          onChange={(e) => setSiteSettings({ ...siteSettings, password: e.target.value })}
                          placeholder="Enter password"
                        />
                      </div>
                    )}

                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {siteSettings.isPublished ? (
                            <Unlock className="w-4 h-4 text-green-600" />
                          ) : (
                            <Lock className="w-4 h-4 text-slate-400" />
                          )}
                          <span className="text-sm font-medium">
                            {siteSettings.isPublished ? "Published" : "Draft"}
                          </span>
                        </div>
                        <Badge variant={siteSettings.isPublished ? "default" : "secondary"}>
                          {siteSettings.isPublished ? "Live" : "Draft"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Themes */}
              <TabsContent value="themes" className="space-y-4">
                <Card className="border-slate-200/50 shadow-sm bg-white/90 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Choose Theme</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-4">
                      {THEMES.map((theme) => (
                        <div
                          key={theme.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-all ${
                            selectedTheme === theme.id
                              ? "border-rose-500 bg-rose-50"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                          onClick={() => setSelectedTheme(theme.id)}
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={theme.preview || "/placeholder.svg"}
                              alt={theme.name}
                              className="w-16 h-10 object-cover rounded border"
                            />
                            <div className="flex-1">
                              <h4 className="font-medium text-slate-800">{theme.name}</h4>
                              <p className="text-xs text-slate-600">{theme.description}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Colors */}
              <TabsContent value="colors" className="space-y-4">
                <Card className="border-slate-200/50 shadow-sm bg-white/90 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Color Scheme</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(colorScheme).map(([key, value]) => (
                      <div key={key} className="space-y-2">
                        <Label className="capitalize">{key.replace("_", " ")}</Label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={value}
                            onChange={(e) => setColorScheme({ ...colorScheme, [key]: e.target.value })}
                            className="w-12 h-8 rounded border border-slate-300"
                          />
                          <Input
                            value={value}
                            onChange={(e) => setColorScheme({ ...colorScheme, [key]: e.target.value })}
                            className="flex-1 font-mono text-sm"
                          />
                        </div>
                      </div>
                    ))}

                    <div className="pt-4 border-t">
                      <h4 className="font-medium text-slate-800 mb-3">Color Preview</h4>
                      <div className="space-y-2">
                        <div
                          className="h-8 rounded flex items-center px-3 text-white text-sm"
                          style={{ backgroundColor: colorScheme.primary }}
                        >
                          Primary Color
                        </div>
                        <div
                          className="h-8 rounded flex items-center px-3 text-white text-sm"
                          style={{ backgroundColor: colorScheme.secondary }}
                        >
                          Secondary Color
                        </div>
                        <div
                          className="h-8 rounded flex items-center px-3 text-white text-sm"
                          style={{ backgroundColor: colorScheme.accent }}
                        >
                          Accent Color
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Components */}
              <TabsContent value="components" className="space-y-4">
                <Card className="border-slate-200/50 shadow-sm bg-white/90 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Add Components</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {COMPONENT_TYPES.map((component) => (
                        <div
                          key={component.type}
                          className="p-3 border border-slate-200 rounded-lg hover:border-slate-300 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <component.icon className="w-5 h-5 text-slate-600" />
                            <div className="flex-1">
                              <h4 className="font-medium text-slate-800">{component.name}</h4>
                              <p className="text-xs text-slate-600">{component.description}</p>
                            </div>
                            <Button size="sm" variant="outline">
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Website Preview */}
          <div className="lg:col-span-2">
            <Card className="border-slate-200/50 shadow-lg bg-white">
              <CardHeader className="border-b border-slate-200/50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Website Preview</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open in New Tab
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 min-h-[600px]">
                  <div className="max-w-2xl mx-auto">
                    {/* Browser Frame */}
                    <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-slate-200">
                      {/* Browser Header */}
                      <div className="bg-slate-100 px-4 py-2 border-b border-slate-200">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <div className="w-3 h-3 rounded-full bg-red-400"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                            <div className="w-3 h-3 rounded-full bg-green-400"></div>
                          </div>
                          <div className="flex-1 bg-white rounded px-3 py-1 text-xs text-slate-600">
                            yoursite.com/sites/{siteSettings.slug}
                          </div>
                        </div>
                      </div>

                      {/* Website Content */}
                      <div className="min-h-[500px]">
                        {/* Hero Section */}
                        <div
                          className="h-48 flex items-center justify-center text-white relative"
                          style={{
                            background: `linear-gradient(135deg, ${colorScheme.primary}, ${colorScheme.secondary})`,
                          }}
                        >
                          <div className="text-center">
                            <h1 className="text-2xl font-light mb-2">{siteSettings.title}</h1>
                            <p className="text-sm opacity-90">{siteSettings.subtitle}</p>
                          </div>
                        </div>

                        {/* Content Area */}
                        <div className="p-6">
                          <div className="text-center mb-6">
                            <h2 className="text-xl font-medium mb-2" style={{ color: colorScheme.text }}>
                              Welcome to Our Website
                            </h2>
                            <p className="text-slate-600 text-sm">
                              This is a live preview of your website. Changes you make will appear here instantly.
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div className="p-4 bg-slate-50 rounded-lg">
                              <h3 className="font-medium mb-2" style={{ color: colorScheme.text }}>
                                Our Story
                              </h3>
                              <p className="text-slate-600 text-sm">Your beautiful story goes here...</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-lg">
                              <h3 className="font-medium mb-2" style={{ color: colorScheme.text }}>
                                Event Details
                              </h3>
                              <p className="text-slate-600 text-sm">Date, time, and location details...</p>
                            </div>
                          </div>

                          <div className="text-center">
                            <button
                              className="px-6 py-2 rounded-lg text-white text-sm font-medium"
                              style={{ backgroundColor: colorScheme.accent }}
                            >
                              RSVP Now
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
