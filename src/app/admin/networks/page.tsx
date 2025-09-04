'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Network {
  id: string;
  name: string;
  ipAddress: string;
  isActive: boolean;
  notes?: string;
}

export default function NetworkManagementPage() {
  const [networks, setNetworks] = useState<Network[]>([]);
  const [currentIP, setCurrentIP] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNetwork, setNewNetwork] = useState({ 
    name: '', 
    ipAddress: '' 
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchNetworks();
    fetchCurrentIP();
  }, []);

  const fetchCurrentIP = async () => {
    try {
      const res = await fetch('/api/get-ip');
      const data = await res.json();
      setCurrentIP(data.ip);
    } catch (error) {
      console.error('Error fetching IP:', error);
      setCurrentIP('Unable to detect IP');
    }
  };

  const fetchNetworks = async () => {
    try {
      const res = await fetch('/api/admin/networks');
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/admin/login');
          return;
        }
        throw new Error('Failed to fetch networks');
      }
      const data = await res.json();
      setNetworks(data.networks || []);
    } catch (error) {
      console.error('Fetch error:', error);
      setError('Failed to load networks');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNetwork = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/admin/networks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNetwork),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to add network');
      }

      setMessage(`✅ Network ${data.name} added successfully!`);
      setNewNetwork({ name: '', ipAddress: '' });
      setShowAddForm(false);
      await fetchNetworks();
      
      setTimeout(() => setMessage(''), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to add network');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleToggleActive = async (networkId: string, isActive: boolean) => {
    try {
      const res = await fetch('/api/admin/networks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ networkId, isActive: !isActive }),
      });

      if (!res.ok) {
        throw new Error('Failed to update network');
      }

      await fetchNetworks();
    } catch (err: any) {
      setError(err.message || 'Failed to update network');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleUseCurrentIP = () => {
    setNewNetwork({ ...newNetwork, ipAddress: currentIP });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4" style={{ color: '#000000' }}>Loading networks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold" style={{ color: '#000000' }}>Network Management</h1>
              <p style={{ color: '#666666' }}>Configure allowed IP addresses for WiFi-based clock-in</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                {showAddForm ? '✕ Cancel' : '+ Add Network'}
              </button>
              <a
                href="/admin"
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
              >
                ← Back to Dashboard
              </a>
            </div>
          </div>
        </div>

        {/* Current IP Display */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold" style={{ color: '#000000' }}>Your Current IP Address</h3>
              <p className="text-2xl font-mono mt-2" style={{ color: '#000000' }}>{currentIP || 'Detecting...'}</p>
              <p className="text-sm mt-1" style={{ color: '#666666' }}>
                This is the IP address that would be used if you clock in from this network
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 rounded-lg">
            <p style={{ color: '#000000' }} className="font-medium">{message}</p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 rounded-lg">
            <p style={{ color: '#000000' }} className="font-medium">{error}</p>
          </div>
        )}

        {/* Add Network Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4" style={{ color: '#000000' }}>Add Allowed Network</h2>
            <form onSubmit={handleAddNetwork}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                    Network Name *
                  </label>
                  <input
                    type="text"
                    value={newNetwork.name}
                    onChange={(e) => setNewNetwork({ ...newNetwork, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    style={{ color: '#000000', backgroundColor: '#ffffff' }}
                    placeholder="e.g., Main Office WiFi"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                    IP Address *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newNetwork.ipAddress}
                      onChange={(e) => setNewNetwork({ ...newNetwork, ipAddress: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      style={{ color: '#000000', backgroundColor: '#ffffff' }}
                      placeholder="e.g., 192.168.1.1"
                      required
                    />
                    <button
                      type="button"
                      onClick={handleUseCurrentIP}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm whitespace-nowrap"
                    >
                      Use Current
                    </button>
                  </div>
                </div>
                
                <div className="flex items-end gap-2">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                  >
                    Add Network
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Networks Table */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4" style={{ color: '#000000' }}>
            Allowed Networks ({networks.length})
          </h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-3 font-medium" style={{ color: '#000000' }}>Network Name</th>
                  <th className="text-left py-3 px-3 font-medium" style={{ color: '#000000' }}>IP Address</th>
                  <th className="text-center py-3 px-3 font-medium" style={{ color: '#000000' }}>Status</th>
                  <th className="text-left py-3 px-3 font-medium" style={{ color: '#000000' }}>Notes</th>
                  <th className="text-center py-3 px-3 font-medium" style={{ color: '#000000' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {networks.map((network) => (
                  <tr key={network.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-3">
                      <span style={{ color: '#000000', fontWeight: 600 }}>{network.name}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono text-sm" style={{ color: '#000000', fontWeight: 600 }}>
                        {network.ipAddress}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        network.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {network.isActive ? '✓ Active' : '✕ Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span style={{ color: '#666666' }} className="text-sm">
                        {network.notes || '-'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleToggleActive(network.id, network.isActive)}
                          className={`px-3 py-1 ${
                            network.isActive ? 'bg-gray-600' : 'bg-green-600'
                          } text-white rounded text-sm hover:opacity-90 font-medium`}
                        >
                          {network.isActive ? 'Disable' : 'Enable'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {networks.length === 0 && (
            <div className="text-center py-12">
              <p style={{ color: '#666666' }} className="text-lg">No networks configured</p>
              <p style={{ color: '#666666' }} className="text-sm mt-2">Add your office network IP to allow WiFi-based clock-in</p>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-yellow-50 rounded-lg p-6 mt-6">
          <h3 className="font-bold mb-2" style={{ color: '#000000' }}>📝 How it works:</h3>
          <ul className="space-y-1 text-sm" style={{ color: '#000000' }}>
            <li>• When employees are connected to an allowed network, they can clock in without GPS</li>
            <li>• The system checks their public IP address against this whitelist</li>
            <li>• If not on an allowed network, normal GPS verification is required</li>
            <li>• Your current IP ({currentIP}) is what employees would use from this location</li>
            <li>• Add all your office locations' public IP addresses</li>
          </ul>
        </div>
      </div>
    </div>
  );
}