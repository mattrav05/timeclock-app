'use client';

import { useState, useEffect } from 'react';

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchDebugInfo();
  }, []);

  const fetchDebugInfo = async () => {
    try {
      const response = await fetch('/api/debug-sheets');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      setDebugInfo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading debug info...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Google Sheets Debug Info</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <strong>Error:</strong> {error}
          </div>
        )}

        {debugInfo && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="font-medium">Client Email:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-sm ${debugInfo.environmentVariables?.client_email ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {debugInfo.environmentVariables?.client_email ? 'SET' : 'MISSING'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Private Key:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-sm ${debugInfo.environmentVariables?.private_key ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {debugInfo.environmentVariables?.private_key ? 'SET' : 'MISSING'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Spreadsheet ID:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-sm ${debugInfo.environmentVariables?.spreadsheet_id ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {debugInfo.environmentVariables?.spreadsheet_id ? 'SET' : 'MISSING'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Available Sheets</h2>
              {debugInfo.sheetNames && debugInfo.sheetNames.length > 0 ? (
                <ul className="list-disc list-inside space-y-1">
                  {debugInfo.sheetNames.map((name: string, index: number) => (
                    <li key={index} className="text-gray-700">{name}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-red-600">No sheets found or unable to access sheets</p>
              )}
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Admin Password Status</h2>
              <div className="space-y-2">
                <div>
                  <span className="font-medium">Admin Password Found:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-sm ${debugInfo.adminPasswordFound ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {debugInfo.adminPasswordFound ? 'YES' : 'NO'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Status:</span>
                  <span className="ml-2 text-gray-700">{debugInfo.adminPassword}</span>
                </div>
              </div>
            </div>

            {!debugInfo.success && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                <strong>Connection Error:</strong> {debugInfo.error}
              </div>
            )}
          </div>
        )}

        <div className="mt-8 text-center">
          <button
            onClick={fetchDebugInfo}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
          >
            Refresh Debug Info
          </button>
        </div>
      </div>
    </div>
  );
}