"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Construction, Wrench, Calendar } from "lucide-react"

export default function TasksPage() {
  const navItems = [{ label: "Plan", href: "/plan", active: false }]

  return (
    <>
      <div className="space-y-6 max-w-full p-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 text-white shadow-2xl mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/20 via-transparent to-amber-500/20"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-light">Tasks</h1>
                <p className="text-slate-300">Task management and planning tools</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="h-[70vh]">
          <Card className="flex flex-col h-full border-slate-200/50 shadow-lg bg-white/90 backdrop-blur-sm overflow-hidden">
            <CardContent className="flex-1 overflow-y-auto p-6">
              {/* Under Construction Card */}
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center mb-6">
                  <Construction className="w-12 h-12 text-amber-600" />
                </div>

                <div className="space-y-4 max-w-md">
                  <h2 className="text-2xl font-light text-slate-800">Page Under Construction</h2>
                  <p className="text-slate-600 leading-relaxed">
                    We're working hard to bring you an amazing task management experience. This page will include advanced
                    planning tools, task assignments, and project tracking capabilities.
                  </p>

                  <div className="flex items-center justify-center gap-2 text-sm text-slate-500 mt-6">
                    <Wrench className="w-4 h-4" />
                    <span>Coming Soon</span>
                  </div>
                </div>
              </div>

              {/* Feature Preview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <Card className="border-slate-200/50 shadow-sm bg-white/90 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-slate-800 font-medium text-base flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-blue-600" />
                      </div>
                      Task Planning
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600 text-sm">
                      Create and organize tasks with deadlines, priorities, and assignments for seamless event planning.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-slate-200/50 shadow-sm bg-white/90 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-slate-800 font-medium text-base flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <Wrench className="w-4 h-4 text-green-600" />
                      </div>
                      Project Tracking
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600 text-sm">
                      Monitor progress, track milestones, and ensure your event planning stays on schedule.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-slate-200/50 shadow-sm bg-white/90 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-slate-800 font-medium text-base flex items-center gap-2">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Construction className="w-4 h-4 text-purple-600" />
                      </div>
                      Team Collaboration
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600 text-sm">
                      Collaborate with team members, assign responsibilities, and communicate effectively.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
