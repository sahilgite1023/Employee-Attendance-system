'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { adminAPI } from '@/lib/api';
import AdminLayout from '@/components/admin/AdminLayout';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import Loader from '@/components/common/Loader';
import Alert from '@/components/common/Alert';

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [settings, setSettings] = useState({});
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    loadSettings();
  }, [user, router, authLoading]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getSettings();
      const grouped = response.data.grouped;
      setSettings(grouped);
      
      // Initialize form data
      const initialData = {};
      Object.values(grouped).flat().forEach(setting => {
        initialData[setting.setting_key] = setting.setting_value;
      });
      setFormData(initialData);
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      // Prepare settings array for bulk update
      const settingsArray = Object.entries(formData).map(([key, value]) => ({
        key,
        value,
      }));

      await adminAPI.bulkUpdateSettings(settingsArray);
      setMessage({ type: 'success', text: 'Settings updated successfully' });
      await loadSettings();
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to update settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset all settings to default values?')) {
      return;
    }

    try {
      setSaving(true);
      setMessage(null);
      await adminAPI.resetSettings();
      setMessage({ type: 'success', text: 'Settings reset to defaults successfully' });
      await loadSettings();
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to reset settings' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
        <p className="text-gray-600 mt-1">
          Configure attendance and leave rules
        </p>
      </div>

      {message && (
        <Alert
          type={message.type}
          message={message.text}
          onClose={() => setMessage(null)}
        />
      )}

      {settings.attendance && (
        <Card className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Attendance Rules
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {settings.attendance.map((setting) => (
              <div key={setting.setting_key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {setting.description}
                </label>
                <Input
                  type={setting.setting_type === 'time' ? 'time' : 'number'}
                  value={formData[setting.setting_key] || ''}
                  onChange={(e) => handleChange(setting.setting_key, e.target.value)}
                  min={setting.setting_type === 'number' ? '0' : undefined}
                />
              </div>
            ))}
          </div>
        </Card>
      )}

      {settings.leave && (
        <Card className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Leave Rules
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {settings.leave.map((setting) => (
              <div key={setting.setting_key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {setting.description}
                </label>
                <Input
                  type="number"
                  value={formData[setting.setting_key] || ''}
                  onChange={(e) => handleChange(setting.setting_key, e.target.value)}
                  min="0"
                />
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="flex gap-4">
        <Button onClick={handleSave} disabled={saving} className="flex-1">
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
        <Button onClick={handleReset} disabled={saving} variant="outline">
          Reset
        </Button>
      </div>

      <Card className="mt-6 bg-blue-50 border-blue-200">
        <p className="text-sm text-blue-900">
          <strong>Note:</strong> Changes take effect immediately. Time format: HH:MM (24-hour).
        </p>
      </Card>
    </AdminLayout>
  );
}
