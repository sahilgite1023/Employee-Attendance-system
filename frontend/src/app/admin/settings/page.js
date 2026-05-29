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

  // Render a single setting field based on its type
  const renderSettingField = (setting) => {
    const key = setting.setting_key;
    const type = setting.setting_type;

    if (type === 'boolean') {
      const isOn = formData[key] === 'true' || formData[key] === true;
      return (
        <div key={key} className="flex items-center justify-between py-3 px-4 bg-slate-50 ring-1 ring-inset ring-slate-100 rounded-xl">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              {setting.description}
            </label>
            <span className="text-xs text-slate-400">{key}</span>
          </div>
          <button
            type="button"
            onClick={() => handleChange(key, isOn ? 'false' : 'true')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
              isOn ? 'bg-success-500' : 'bg-slate-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isOn ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      );
    }

    return (
      <div key={key}>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {setting.description}
        </label>
        <Input
          type={type === 'time' ? 'time' : 'number'}
          value={formData[key] || ''}
          onChange={(e) => handleChange(key, e.target.value)}
          min={type === 'number' ? '0' : undefined}
        />
      </div>
    );
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
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">System Settings</h2>
          <p className="page-subtitle mt-1">
            Configure attendance, leave, and security rules.
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
          <Card title="Attendance Rules">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {settings.attendance.map((setting) => renderSettingField(setting))}
            </div>
          </Card>
        )}

        {settings.leave && (
          <Card title="Leave Rules">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {settings.leave.map((setting) => renderSettingField(setting))}
            </div>
          </Card>
        )}

        {settings.security && (
          <Card title="Security & Face Verification" subtitle="Control face recognition requirements for employee check-in.">
            <div className="space-y-4">
              {settings.security.map((setting) => renderSettingField(setting))}
            </div>
          </Card>
        )}

        <div className="flex gap-3">
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button onClick={handleReset} disabled={saving} variant="secondary">
            Reset
          </Button>
        </div>

        <Card className="bg-primary-50 border-primary-100">
          <p className="text-sm text-primary-900">
            <strong>Note:</strong> Changes take effect immediately. Time format: HH:MM (24-hour).
            Face match threshold: 30 = very strict, 50 = balanced, 70 = lenient.
          </p>
        </Card>
      </div>
    </AdminLayout>
  );
}
