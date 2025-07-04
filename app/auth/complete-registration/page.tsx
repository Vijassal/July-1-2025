"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClientSupabase } from "@/lib/supabase"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Eye, EyeOff, Loader2, Mail, Lock, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

const completeRegistrationSchema = z
  .object({
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

type CompleteRegistrationFormData = z.infer<typeof completeRegistrationSchema>

export default function CompleteRegistrationPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [invitedEmail, setInvitedEmail] = useState("")
  const [isValidInvite, setIsValidInvite] = useState(false)
  const [checkingInvite, setCheckingInvite] = useState(true)

  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClientSupabase()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompleteRegistrationFormData>({
    resolver: zodResolver(completeRegistrationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      password: "",
      confirmPassword: "",
    },
  })

  // Check if this is a valid invite
  useEffect(() => {
    const checkInvite = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          setError("No authenticated user found")
          setCheckingInvite(false)
          return
        }

        // Check if user has a pending invite
        const { data: pendingInvite, error: inviteError } = await supabase
          .from("account_instance_users")
          .select("id, account_instance_id, role")
          .eq("invited_email", user.email?.toLowerCase())
          .eq("status", "pending")
          .single()

        if (pendingInvite && !inviteError) {
          setInvitedEmail(user.email || "")
          setIsValidInvite(true)
        } else {
          setError("No pending invitation found for this email")
        }
      } catch (error) {
        console.error("Error checking invite:", error)
        setError("Failed to verify invitation")
      } finally {
        setCheckingInvite(false)
      }
    }

    checkInvite()
  }, [supabase])

  const onSubmit = async (data: CompleteRegistrationFormData) => {
    setError("")
    setIsLoading(true)

    try {
      // Update user metadata with first and last name
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
          name: `${data.firstName} ${data.lastName}`,
          registration_completed: true
        }
      })

      if (updateError) {
        throw updateError
      }

      // Update password
      const { error: passwordError } = await supabase.auth.updateUser({
        password: data.password
      })

      if (passwordError) {
        throw passwordError
      }

      // Update the account_instance_users table to mark the user as active
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { error: accountUpdateError } = await supabase
          .from("account_instance_users")
          .update({
            status: "active",
            user_id: user.id
          })
          .eq("invited_email", user.email?.toLowerCase())
          .eq("status", "pending")

        if (accountUpdateError) {
          console.error("Error updating account instance user:", accountUpdateError)
          // Don't throw error here as the main registration is complete
        }
      }

      toast.success("Registration completed successfully!")
      router.push("/dashboard")
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred. Please try again."
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  if (checkingInvite) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Verifying invitation...</p>
        </div>
      </div>
    )
  }

  if (!isValidInvite) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/auth/login">
              <Button className="w-full">Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Decorative background */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary/20 via-primary/30 to-primary/40 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10 bg-grid-16" />
        <div className="relative w-full flex items-center justify-center p-12">
          <div className="text-center space-y-6 max-w-md">
            <h1 className="text-5xl font-bold text-primary-foreground drop-shadow-lg">Complete Registration</h1>
            <p className="text-xl text-primary-foreground/90">
              You've been invited to join an event planning team. Complete your registration to get started.
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Registration form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background min-w-0">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-3xl font-bold">Complete Your Registration</CardTitle>
            <CardDescription>Welcome! Please complete your account setup</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Invited Email:</strong> {invitedEmail}
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="firstName"
                      placeholder="John"
                      className="pl-10"
                      disabled={isLoading}
                      {...register("firstName")}
                    />
                  </div>
                  {errors.firstName && <p className="text-sm text-destructive">{errors.firstName.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      className="pl-10"
                      disabled={isLoading}
                      {...register("lastName")}
                    />
                  </div>
                  {errors.lastName && <p className="text-sm text-destructive">{errors.lastName.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    className="pl-10 pr-10"
                    disabled={isLoading}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    className="pl-10 pr-10"
                    disabled={isLoading}
                    {...register("confirmPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Completing Registration...
                  </>
                ) : (
                  "Complete Registration"
                )}
              </Button>
            </form>

            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 