import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Get the client's IP address from various possible headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  // Priority order for IP detection
  let clientIp = forwardedFor?.split(',')[0].trim() || 
                 cfConnectingIp || 
                 realIp || 
                 'unknown';
  
  // Handle localhost connections
  if (clientIp === '::1' || clientIp === '127.0.0.1' || clientIp === 'unknown') {
    // Try to get public IP from external service
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      clientIp = data.ip;
    } catch (error) {
      console.error('Failed to fetch public IP:', error);
    }
  }

  return NextResponse.json({ 
    ip: clientIp,
    isLocalhost: clientIp === '::1' || clientIp === '127.0.0.1',
    headers: {
      'x-forwarded-for': forwardedFor,
      'x-real-ip': realIp,
      'cf-connecting-ip': cfConnectingIp
    }
  });
}