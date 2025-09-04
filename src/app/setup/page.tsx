'use client';

import { useState } from 'react';

export default function SetupPage() {
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const setupAdmin = async () => {
    setLoading(true);
    setStatus('Setting up admin password...');
    
    try {
      const response = await fetch('/api/setup-admin');
      const data = await response.json();
      
      if (data.success) {
        setStatus(`✅ Success! Admin password is: ${data.password || 'admin123'}`);
      } else {
        setStatus(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-8">Admin Setup</h1>
        
        <div className="space-y-4">
          <p className="text-gray-600 text-center">
            Click the button below to set up your admin password for the timeclock application.
          </p>
          
          <button
            onClick={setupAdmin}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            {loading ? 'Setting up...' : 'Setup Admin Password'}
          </button>
          
          {status && (
            <div className={`p-4 rounded-md ${
              status.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {status}
            </div>
          )}
          
          {status.includes('✅') && (
            <div className="mt-4 p-4 bg-blue-100 rounded-md">
              <p className="text-blue-700 text-sm">
                <strong>Next steps:</strong>
                <br />
                1. Go to <a href="/admin" className="underline">Admin Login</a>
                <br />
                2. Use password: <strong>admin123</strong>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}