import { useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  MapPin,
  Image as ImageIcon,
  Mic,
  Send,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  Sparkles,
  RotateCcw,
  Volume2,
} from 'lucide-react';

import { submitReport } from '../api/reports';
import { apiErrorMessage } from '../api/mappers';
import { useToasts } from '../hooks/useToasts';

const EXAMPLES = [
  {
    label: 'Flood',
    description: 'Severe flooding has isolated homes and blocked access roads near the riverbank. Several families need urgent medical attention and shelter support.',
    location: 'Chennai, Tamil Nadu',
  },
  {
    label: 'Medical',
    description: 'Multiple patients are waiting for immediate triage after a building collapse and several people are experiencing respiratory distress.',
    location: 'Kolkata, West Bengal',
  },
  {
    label: 'Fire',
    description: 'A large warehouse fire is spreading quickly and threatening nearby homes and vehicles. Fire crews and evacuation support are urgently needed.',
    location: 'Mumbai, Maharashtra',
  },
  {
    label: 'Shelter',
    description: 'Hundreds of displaced residents need temporary shelter, blankets, water, and safe sleeping space after flash flooding.',
    location: 'Bhubaneswar, Odisha',
  },
  {
    label: 'Food',
    description: 'Community kitchens are running low on food packs, clean water, and basic medical supplies for families sheltering in a school compound.',
    location: 'Hyderabad, Telangana',
  },
  {
    label: 'Road Damage',
    description: 'A bridge collapse has blocked emergency access and left residents stranded on the wrong side of the road with limited transport.',
    location: 'Pune, Maharashtra',
  },
] as const;

export default function SubmitReport() {
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [voice, setVoice] = useState<File | null>(null);
  const [voicePreview, setVoicePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const { pushToast } = useToasts();
  const navigate = useNavigate();

  const descriptionLength = description.trim().length;
  const locationLength = location.trim().length;
  const valid = descriptionLength >= 10 && locationLength >= 3;

  const validationMessage = useMemo(() => {
    if (!descriptionLength) return 'Describe the incident clearly.';
    if (descriptionLength < 10) return 'Add at least 10 characters for a useful AI assessment.';
    return 'Description looks complete.';
  }, [descriptionLength]);

  const locationMessage = useMemo(() => {
    if (!locationLength) return 'Add the nearest district or settlement.';
    if (locationLength < 3) return 'Add at least 3 characters.';
    return 'Location looks ready.';
  }, [locationLength]);

  const resetForm = () => {
    setDescription('');
    setLocation('');
    setImage(null);
    setImagePreview(null);
    setVoice(null);
    setVoicePreview(null);
    setError('');
    setSuccess(false);
  };

  const applyExample = (example: (typeof EXAMPLES)[number]) => {
    setDescription(example.description);
    setLocation(example.location);
    setError('');
    setSuccess(false);
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setImage(file);
    if (!file) {
      setImagePreview(null);
      return;
    }
    const preview = URL.createObjectURL(file);
    setImagePreview(preview);
  };

  const handleVoiceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setVoice(file);
    if (!file) {
      setVoicePreview(null);
      return;
    }
    const preview = URL.createObjectURL(file);
    setVoicePreview(preview);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!valid || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const report = await submitReport({
        description: description.trim(),
        location: location.trim(),
        image: image ?? undefined,
        voice: voice ?? undefined,
      });
      resetForm();
      setSuccess(true);
      pushToast('Report submitted', 'success');
      navigate(`/incident/${report.id}`);
    } catch (err) {
      const message = apiErrorMessage(err, 'submit');
      setError(message);
      pushToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-sm sm:p-8">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-rose-100 p-2 text-rose-700">
            <ShieldCheck className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Submit Emergency Report</h2>
            <p className="mt-1 text-sm text-slate-500">
              Reports are analyzed by AI and routed to the priority queue for coordinated response.
            </p>
          </div>
        </div>

        {success && (
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 animate-pulse">
            <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
            <div className="text-sm">
              <p className="font-semibold text-emerald-800">Report submitted</p>
              <p className="text-emerald-700">AI analysis is underway and you’ll be redirected shortly…</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertTriangle className="h-5 w-5" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-slate-700">Operational details</p>
            <div className="flex items-center gap-2">
              <button type="button" onClick={resetForm} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
                <RotateCcw className="h-4 w-4" /> Reset
              </button>
              <button type="button" onClick={() => applyExample(EXAMPLES[0])} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
                <Sparkles className="h-4 w-4" /> Use example
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((example) => (
              <button key={example.label} type="button" onClick={() => applyExample(example)} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-100">
                {example.label}
              </button>
            ))}
          </div>

          <div>
            <label htmlFor="description" className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
              <FileText className="h-4 w-4" /> Emergency Description
            </label>
            <textarea
              id="description"
              required
              rows={5}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe the emergency situation…"
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm shadow-sm transition focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            />
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span>{validationMessage}</span>
              <span>{descriptionLength}/280</span>
            </div>
          </div>

          <div>
            <label htmlFor="location" className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
              <MapPin className="h-4 w-4" /> District / Location
            </label>
            <input
              id="location"
              required
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="e.g. Chennai, Tamil Nadu"
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm shadow-sm transition focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            />
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span>{locationMessage}</span>
              <span>{locationLength}/80</span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="image" className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                <ImageIcon className="h-4 w-4" /> Image Upload <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <input
                id="image"
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleImageChange}
                className="mt-1.5 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
              />
              {image && <p className="mt-1 text-xs text-slate-500">{image.name}</p>}
              {imagePreview && (
                <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
                  <img src={imagePreview} alt="Selected preview" className="h-36 w-full object-cover" />
                </div>
              )}
            </div>

            <div>
              <label htmlFor="voice" className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                <Mic className="h-4 w-4" /> Voice Upload <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <input
                id="voice"
                type="file"
                accept="audio/*"
                onChange={handleVoiceChange}
                className="mt-1.5 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
              />
              {voice && <p className="mt-1 text-xs text-slate-500">{voice.name}</p>}
              {voicePreview && (
                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Volume2 className="h-4 w-4" /> Audio preview ready
                  </div>
                  <audio controls src={voicePreview} className="mt-2 w-full" />
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={!valid || submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {submitting ? 'Submitting…' : 'Submit Report'}
          </button>
        </form>
      </div>
    </div>
  );
}
