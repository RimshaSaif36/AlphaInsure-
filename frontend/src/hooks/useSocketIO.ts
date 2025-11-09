'use client'

import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import toast from 'react-hot-toast'

interface UseSocketIOProps {
  onNewAlert?: (alert: any) => void
  onClaimUpdate?: (claim: any) => void
  onMonitoringUpdate?: (data: any) => void
  enabled?: boolean
}

export function useSocketIO({ 
  onNewAlert, 
  onClaimUpdate, 
  onMonitoringUpdate, 
  enabled = true 
}: UseSocketIOProps) {
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!enabled) return

    // Demo mode - disable Socket.IO for quick demo
    console.log('Demo mode: Socket.IO disabled for presentation')
    
    // Simulate connection success
    setTimeout(() => {
      toast.success('Demo mode: Real-time updates simulated', { 
        duration: 2000 
      })
    }, 500)

    return () => {
      console.log('Demo mode: Cleanup complete')
    }
  }, [enabled, onNewAlert, onClaimUpdate, onMonitoringUpdate])

  // Demo mode functions - no actual socket operations
  const emitTestAlert = () => {
    console.log('Demo: Test alert simulated')
    toast('Demo: Test alert simulated', { 
      duration: 2000,
      icon: 'ℹ️',
    })
  }

  const emitJoinRoom = () => {
    console.log('Demo: Join room simulated')
  }

  return {
    socket: null, // Disabled for demo
    isConnected: true, // Always true for demo
    emitTestAlert,
    emitJoinRoom,
  }
}