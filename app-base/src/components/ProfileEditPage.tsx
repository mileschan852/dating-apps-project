import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Eye, EyeOff } from 'lucide-react';
import type { UserProfile, Lang } from '@dating/core';
import { useTelegramPhoto, getAge } from '@dating/core';

export interface ProfileEditPageProps {
  profile: UserProfile;
  lang: Lang;
  onSave: (updated: UserProfile) => Promise<void>;
  onBack: () => void;
  /** Whether the hide-age feature is currently active */
  hideAgeActive?: boolean;
  /** Called when user toggles the hide-age option */
  onToggleHideAge?: () => void;
  /** Extra fields rendered below the base fields — for app-specific preferences */
  children?: React.ReactNode;
}

/**
 * Template profile edit page.
 * Shows: name, DOB, gender, height, weight, hide-age toggle.
 * Apps can inject preference fields via `children`.
 */
export function ProfileEditPage({
  profile,
  lang,
  onSave,
  onBack,
  hideAgeActive = false,
  onToggleHideAge,
  children,
}: ProfileEditPageProps) {
  const tgPhoto = useTelegramPhoto();
  const [draft, setDraft] = useState<UserProfile>({ ...profile });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Re-sync when profile identity changes
  useEffect(() => {
    setDraft({ ...profile });
  }, [profile.id]);

  // Always use Telegram photo
  useEffect(() => {
    if (tgPhoto) {
      setDraft((prev) => ({ ...prev, tgPhotoUrl: tgPhoto, hasPhoto: true }));
    }
  }, [tgPhoto]);

  const update = <K extends keyof UserProfile>(field: K, value: UserProfile[K]) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await onSave(draft);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('ProfileEditPage save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const age = draft.dob ? getAge(draft.dob) : null;

  const photoSrc = tgPhoto || draft.tgPhotoUrl || '';

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0A0A0A]/95 backdrop-blur-sm border-b border-[#1C1C1E] px-4 py-3 flex items-center justify-between">
        <button onClick={onBack} className="nav-press p-1 -ml-1">
          <ArrowLeft className="w-5 h-5 text-[#8E8E93]" />
        </button>
        <span className="font-semibold text-sm">
          {lang === 'tc' ? '編輯個人資料' : lang === 'sc' ? '编辑个人资料' : 'Edit Profile'}
        </span>
        <button
          onClick={handleSave}
          disabled={saving}
          className="nav-press flex items-center gap-1.5 px-3 py-1.5 rounded-full gradient-btn text-white text-xs font-semibold disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" />
          {saved
            ? (lang === 'tc' ? '已儲存' : lang === 'sc' ? '已保存' : 'Saved!')
            : saving
            ? '…'
            : (lang === 'tc' ? '儲存' : lang === 'sc' ? '保存' : 'Save')}
        </button>
      </div>

      <div className="px-4 pt-4 space-y-5">
        {/* Photo (read-only from Telegram) */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-[#1C1C1E] border-2 border-[var(--app-primary)]">
            {photoSrc ? (
              <img src={photoSrc} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl text-[#48484A]">
                👤
              </div>
            )}
          </div>
          <p className="text-[10px] text-[#48484A]">
            {lang === 'tc' ? '頭像來自 Telegram' : lang === 'sc' ? '头像来自 Telegram' : 'Photo from Telegram'}
          </p>
        </div>

        {/* Name */}
        <Field label={lang === 'tc' ? '名稱' : lang === 'sc' ? '名称' : 'Name'}>
          <input
            type="text"
            value={draft.name || ''}
            onChange={(e) => update('name', e.target.value)}
            maxLength={30}
            className="w-full bg-[#1C1C1E] text-white text-sm rounded-xl px-4 py-3 border border-[#2C2C2E] focus:border-[var(--app-primary)] outline-none"
            placeholder="Your name"
          />
        </Field>

        {/* Date of Birth */}
        <Field label={lang === 'tc' ? '出生日期' : lang === 'sc' ? '出生日期' : 'Date of Birth'}>
          <input
            type="date"
            value={draft.dob || ''}
            onChange={(e) => update('dob', e.target.value)}
            className="w-full bg-[#1C1C1E] text-white text-sm rounded-xl px-4 py-3 border border-[#2C2C2E] focus:border-[var(--app-primary)] outline-none"
          />
          {age !== null && (
            <p className="text-xs text-[#8E8E93] mt-1 ml-1">
              {lang === 'tc' ? `年齡：${age}` : lang === 'sc' ? `年龄：${age}` : `Age: ${age}`}
            </p>
          )}
        </Field>

        {/* Hide Age Toggle */}
        {onToggleHideAge && (
          <div className="flex items-center justify-between bg-[#1C1C1E] rounded-xl px-4 py-3 border border-[#2C2C2E]">
            <div>
              <p className="text-sm font-medium">
                {lang === 'tc' ? '隱藏年齡' : lang === 'sc' ? '隐藏年龄' : 'Hide Age'}
              </p>
              <p className="text-[11px] text-[#8E8E93] mt-0.5">
                {lang === 'tc' ? '其他用戶看不到你的年齡' : lang === 'sc' ? '其他用户看不到你的年龄' : 'Other users won\'t see your age'}
              </p>
            </div>
            <button
              onClick={onToggleHideAge}
              className="nav-press flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors"
              style={hideAgeActive
                ? { background: 'rgba(var(--app-primary-rgb, 255,107,53),0.15)', borderColor: 'var(--app-primary)', color: 'var(--app-primary)' }
                : { background: 'transparent', borderColor: '#2C2C2E', color: '#8E8E93' }
              }
            >
              {hideAgeActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {hideAgeActive
                ? (lang === 'tc' ? '已隱藏' : lang === 'sc' ? '已隐藏' : 'Hidden')
                : (lang === 'tc' ? '顯示' : lang === 'sc' ? '显示' : 'Visible')}
            </button>
          </div>
        )}

        {/* Gender */}
        <Field label={lang === 'tc' ? '性別' : lang === 'sc' ? '性别' : 'Gender'}>
          <select
            value={draft.gender || ''}
            onChange={(e) => update('gender', e.target.value)}
            className="w-full bg-[#1C1C1E] text-white text-sm rounded-xl px-4 py-3 border border-[#2C2C2E] focus:border-[var(--app-primary)] outline-none appearance-none"
          >
            <option value="">Select…</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Non-binary">Non-binary</option>
          </select>
        </Field>

        {/* Height */}
        <Field label={lang === 'tc' ? '身高 (cm)' : lang === 'sc' ? '身高 (cm)' : 'Height (cm)'}>
          <input
            type="number"
            value={draft.height || ''}
            onChange={(e) => update('height', Number(e.target.value))}
            min={100}
            max={250}
            className="w-full bg-[#1C1C1E] text-white text-sm rounded-xl px-4 py-3 border border-[#2C2C2E] focus:border-[var(--app-primary)] outline-none"
            placeholder="170"
          />
        </Field>

        {/* Weight */}
        <Field label={lang === 'tc' ? '體重 (kg)' : lang === 'sc' ? '体重 (kg)' : 'Weight (kg)'}>
          <input
            type="number"
            value={draft.weight || ''}
            onChange={(e) => update('weight', Number(e.target.value))}
            min={30}
            max={300}
            className="w-full bg-[#1C1C1E] text-white text-sm rounded-xl px-4 py-3 border border-[#2C2C2E] focus:border-[var(--app-primary)] outline-none"
            placeholder="65"
          />
        </Field>

        {/* App-specific fields injected here */}
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-[#8E8E93] font-medium uppercase mb-1.5 ml-1">
        {label}
      </label>
      {children}
    </div>
  );
}
