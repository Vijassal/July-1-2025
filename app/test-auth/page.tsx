"use client"

import { useEffect, useState } from "react"
import { createClientSupabase, ensureAuthCookie } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestAuthPage() {
  const [authStatus, setAuthStatus] = useState<string>("Checking...")
  const [session, setSession] = useState<any>(null)
  const [cookies, setCookies] = useState<string>("")
  const [testEmail, setTestEmail] = useState("vishaljassal.4+july3testuser@gmail.com")
  const [testResult, setTestResult] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const supabase = createClientSupabase()

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      
      if (session) {
        setAuthStatus("✅ Authenticated")
        console.log("Session found:", session)
        
        // Check cookies
        const cookieString = document.cookie
        setCookies(cookieString)
        console.log("Cookies:", cookieString)
        
        // Try to ensure auth cookie
        await ensureAuthCookie()
        
        // Check cookies again
        const updatedCookies = document.cookie
        setCookies(updatedCookies)
        console.log("Updated cookies:", updatedCookies)
        
      } else {
        setAuthStatus("❌ Not authenticated")
      }
    } catch (error) {
      console.error("Auth check error:", error)
      setAuthStatus("❌ Error checking auth")
    }
  }

  const testInvite = async () => {
    setLoading(true)
    setTestResult("Testing...")
    
    try {
      // Ensure auth cookie is set
      await ensureAuthCookie()
      
      // Test GET endpoint
      const getResponse = await fetch('/api/team/invite?accountInstanceId=471e29fe-0de4-4179-a641-4557a792e9dd', {
        credentials: 'include'
      })
      
      let result = `GET /api/team/invite: ${getResponse.status}\n`
      const getData = await getResponse.json()
      result += `GET Response: ${JSON.stringify(getData, null, 2)}\n\n`
      
      if (getResponse.ok) {
        // Test POST endpoint
        const postResponse = await fetch('/api/team/invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            email: testEmail,
            accountInstanceId: '471e29fe-0de4-4179-a641-4557a792e9dd',
            role: 'member'
          })
        })
        
        result += `POST /api/team/invite: ${postResponse.status}\n`
        const postData = await postResponse.json()
        result += `POST Response: ${JSON.stringify(postData, null, 2)}\n`
        
        if (postResponse.ok) {
          result += "\n✅ Invite successful!"
        } else {
          result += "\n❌ Invite failed!"
        }
      } else {
        result += "❌ GET request failed - cannot test invite"
      }
      
      setTestResult(result)
    } catch (error) {
      console.error("Test error:", error)
      setTestResult(`❌ Test error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-bold">Auth Test Page</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Authentication Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <strong>Status:</strong> {authStatus}
          </div>
          
          {session && (
            <div>
              <strong>User ID:</strong> {session.user.id}
            </div>
          )}
          
          <div>
            <strong>Cookies:</strong>
            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
              {cookies || "No cookies found"}
            </pre>
          </div>
          
          <Button onClick={checkAuthStatus}>
            Refresh Auth Status
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Test Invite Functionality</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Test Email:</label>
            <Input
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="Enter email to invite"
            />
          </div>
          
          <Button onClick={testInvite} disabled={loading}>
            {loading ? "Testing..." : "Test Invite"}
          </Button>
          
          {testResult && (
            <div>
              <strong>Test Result:</strong>
              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                {testResult}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 