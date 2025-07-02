"use client"

import React, { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClientSupabase, clearAuthState } from "@/lib/supabase"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Eye, EyeOff, Loader2, Mail, Lock, Users, Briefcase, Store } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { getUserRegisteredTypes } from "@/lib/auth-guards"

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean(),
})

type LoginFormData = z.infer<typeof loginSchema>
type UserType = "regular" | "professional" | "vendor"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [activeTab, setActiveTab] = useState<UserType>("regular")

  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClientSupabase()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  })

  // Show registration success message if redirected from register
  React.useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setSuccess("Registration successful! Please sign in with your new account.")
      toast.success("Registration successful! Please sign in.")
    }
  }, [searchParams])

  // Reset form when switching tabs
  const handleTabChange = (value: string) => {
    setActiveTab(value as UserType)
    setError("")
    setSuccess("")
    reset()
  }

  const onSubmit = async (data: LoginFormData) => {
    setError("")
    setSuccess("")
    setIsLoading(true)

    try {
      // Clear any existing auth state before signing in
      await clearAuthState()

      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      console.log('[Login] signInWithPassword result:', { authData, signInError });

      if (signInError) {
        setError(signInError.message)
        toast.error(signInError.message)
        return
      }

      if (authData.user) {
        // Check if user is registered for the selected type
        const registeredTypes = await getUserRegisteredTypes(authData.user.id)
        console.log('[Login] Registered types:', registeredTypes)

        if (!registeredTypes.includes(activeTab)) {
          setError(`You are not registered as a ${activeTab} user. Please register for this user type first.`)
          toast.error(`Access denied: Not registered as ${activeTab} user`)
          return
        }

        // Update user metadata with user type
        const { error: updateError } = await supabase.auth.updateUser({
          data: {
            current_user_type: activeTab,
            last_login: new Date().toISOString(),
          },
        })

        if (updateError) {
          console.error("Error updating user metadata:", updateError)
        }

        // Log the session after login
        const { data: sessionData } = await supabase.auth.getSession();
        console.log('[Login] Session after login:', sessionData);

        toast.success("Welcome back!")

        // Redirect based on user type
        switch (activeTab) {
          case "regular":
            window.location.href = "/dashboard"
            break
          case "professional":
            window.location.href = "/professional/dashboard"
            break
          case "vendor":
            window.location.href = "/vendor/dashboard"
            break
          default:
            window.location.href = "/dashboard"
        }
        return
      }
    } catch (err) {
      const errorMessage = "An unexpected error occurred. Please try again."
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const getUserTypeInfo = (type: UserType) => {
    switch (type) {
      case "regular":
        return {
          title: "Regular User",
          description: "Plan your own events with full account access",
          icon: Users,
          features: ["Full event planning tools", "Team collaboration", "Complete dashboard access"],
        }
      case "professional":
        return {
          title: "Professional Event Planner",
          description: "Manage multiple client accounts and events",
          icon: Briefcase,
          features: ["Multi-client account access", "Professional tools", "Client management"],
        }
      case "vendor":
        return {
          title: "Vendor",
          description: "Connect with event planners and manage bookings",
          icon: Store,
          features: ["Chat with planners", "Schedule management", "Booking system"],
        }
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Decorative background */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary/20 via-primary/30 to-primary/40 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10 bg-grid-16" />
        <div className="relative w-full flex items-center justify-center p-12">
          <div className="text-center space-y-6 max-w-md">
            <h1 className="text-5xl font-bold text-primary-foreground drop-shadow-lg">Events Planning</h1>
            <p className="text-xl text-primary-foreground/90">
              Create unforgettable moments with our comprehensive event planning platform
            </p>
            <div className="flex items-center justify-center space-x-8 text-primary-foreground/80">
              <div className="text-center">
                <div className="text-2xl font-bold">1000+</div>
                <div className="text-sm">Events Created</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">50k+</div>
                <div className="text-sm">Happy Users</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background min-w-0">
        <Card className="w-full max-w-lg">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-3xl font-bold">Welcome back</CardTitle>
            <CardDescription>Choose your account type and sign in</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>
                  {error}
                  {error.includes("not registered") && (
                    <div className="mt-2">
                      <Link href="/auth/register-user-type" className="text-sm underline hover:no-underline">
                        Register for this user type
                      </Link>
                    </div>
                  )}
                  {error.includes("Session expired") && (
                    <div className="mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          await clearAuthState()
                          toast.success("Authentication state cleared. Please try logging in again.")
                        }}
                      >
                        Clear Session & Retry
                      </Button>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50 text-green-800">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="regular" className="text-xs">
                  <Users className="w-4 h-4 mr-1" />
                  Regular
                </TabsTrigger>
                <TabsTrigger value="professional" className="text-xs">
                  <Briefcase className="w-4 h-4 mr-1" />
                  Professional
                </TabsTrigger>
                <TabsTrigger value="vendor" className="text-xs">
                  <Store className="w-4 h-4 mr-1" />
                  Vendor
                </TabsTrigger>
              </TabsList>

              {(["regular", "professional", "vendor"] as UserType[]).map((type) => {
                const info = getUserTypeInfo(type)
                const Icon = info.icon

                return (
                  <TabsContent key={type} value={type} className="space-y-4">
                    {/* User Type Info */}
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-800">{info.title}</h3>
                          <p className="text-sm text-slate-600">{info.description}</p>
                        </div>
                      </div>
                      <ul className="text-xs text-slate-600 space-y-1">
                        {info.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <div className="w-1 h-1 bg-primary rounded-full" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Login Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email address</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="Enter your email"
                            className="pl-10"
                            disabled={isLoading}
                            {...register("email")}
                          />
                        </div>
                        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            className="pl-10 pr-10"
                            disabled={isLoading}
                            {...register("password")}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={isLoading}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="rememberMe"
                            checked={watch("rememberMe")}
                            onCheckedChange={(checked) => setValue("rememberMe", !!checked)}
                            disabled={isLoading}
                          />
                          <Label htmlFor="rememberMe" className="text-sm font-normal">
                            Remember me
                          </Label>
                        </div>
                        <Link
                          href="/auth/forgot-password"
                          className="text-sm text-primary hover:text-primary/80 transition-colors"
                        >
                          Forgot password?
                        </Link>
                      </div>

                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Signing in...
                          </>
                        ) : (
                          `Sign in as ${info.title}`
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                )
              })}
            </Tabs>

            <div className="text-center text-sm space-y-2">
              <div>
                <span className="text-muted-foreground">Don't have an account? </span>
                <Link
                  href="/auth/register"
                  className="text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  Sign up
                </Link>
              </div>
              <div>
                <span className="text-muted-foreground">Need a different user type? </span>
                <Link
                  href="/auth/register-user-type"
                  className="text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  Register here
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
