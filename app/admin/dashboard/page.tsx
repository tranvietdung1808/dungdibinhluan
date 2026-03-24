'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="bg-[#111111] border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-slate-400 mt-1">Quản lý hệ thống DUNGDIBINHLUAN</p>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Quản lý bài viết */}
          <Link
            href="/admin/guides"
            className="group bg-[#111111] border border-white/10 rounded-xl p-6 hover:border-[#ce5a67]/50 transition-all duration-300 hover:shadow-[0_8px_32px_rgba(206,90,103,0.15)]"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-[#ce5a67]/20 rounded-lg flex items-center justify-center group-hover:bg-[#ce5a67]/30 transition-colors">
                <svg className="w-6 h-6 text-[#ce5a67]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Quản lý bài viết</h3>
                <p className="text-slate-400 text-sm">Tạo và sửa bài hướng dẫn</p>
              </div>
            </div>
            <div className="flex items-center text-[#ce5a67] group-hover:text-[#b44c5c] transition-colors">
              <span className="text-sm font-medium">Quản lý ngay</span>
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          {/* Generate Code */}
          <Link
            href="/admin/generate"
            className="group bg-[#111111] border border-white/10 rounded-xl p-6 hover:border-purple-500/50 transition-all duration-300 hover:shadow-[0_8px_32px_rgba(168,85,247,0.15)]"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Generate Code</h3>
                <p className="text-slate-400 text-sm">Tạo access code mới</p>
              </div>
            </div>
            <div className="flex items-center text-purple-400 group-hover:text-purple-300 transition-colors">
              <span className="text-sm font-medium">Tạo code</span>
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/admin/guides/new"
              className="flex items-center gap-3 p-4 bg-[#ce5a67]/10 border border-[#ce5a67]/20 rounded-lg hover:bg-[#ce5a67]/20 transition-colors"
            >
              <svg className="w-5 h-5 text-[#ce5a67]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-white font-medium">Tạo bài viết mới</span>
            </Link>
            
            <Link
              href="/admin/generate"
              className="flex items-center gap-3 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg hover:bg-purple-500/20 transition-colors"
            >
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              <span className="text-white font-medium">Generate access code</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
