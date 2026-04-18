import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { File, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/AuthContext';
import { medguide } from '@/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function MedGuide() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      if (f.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Max 5MB supported",
          variant: "destructive",
        });
        return;
      }
      if (!f.type.startsWith('image/')) {
        toast({
          title: "Invalid file",
          description: "Please select an image (JPG/PNG)",
          variant: "destructive",
        });
        return;
      }
      setFile(f);
      setPreview(URL.createObjectURL(f));
      setResult(null);
      setError('');
    }
  };

  const analyze = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await medguide.analyze(formData);
      setResult(res);
    } catch (e: any) {
      setError(e.error || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const reanalyze = () => {
    if (file) analyze();
  };

  return (
    <div className="medguide-page space-y-6">
      <header className="page-header">
        <h1>MedGuide - Prescription Analyzer</h1>
        <p className="text-muted-foreground">Upload prescription image for AI-powered medicine extraction</p>
      </header>
      
      <Card>
        <CardHeader>
          <CardTitle>Upload Prescription</CardTitle>
          <CardDescription>Supported: JPG, PNG (max 5MB)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="image-upload">Prescription Image</Label>
            <Input id="image-upload" type="file" accept="image/*" onChange={handleFile} />
          </div>
          {preview && (
            <div className="text-center">
              <img src={preview} alt="Preview" className="max-w-md max-h-96 mx-auto rounded-lg shadow-lg border" />
            </div>
          )}
          <Button onClick={analyze} disabled={!file || loading} className="w-full">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <File className="w-4 h-4 mr-2" />}
            {loading ? 'Analyzing...' : 'Analyze Prescription'}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card>
          <CardContent className="flex items-center gap-3 p-4 bg-destructive/10 border-destructive/30 text-destructive-foreground">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Analysis Results</CardTitle>
            <Button variant="outline" size="sm" onClick={reanalyze} disabled={loading}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Crosscheck Again
            </Button>
          </CardHeader>
          <CardContent>
            {result.medicines?.length ? (
              <div className="space-y-3">
                {result.medicines.map((med: any, i: number) => (
                  <div key={i} className="flex gap-4 p-4 border rounded-lg bg-surface">
                    <div className="font-mono text-sm opacity-75 min-w-[120px]">{med.name}</div>
                    <div className="font-mono text-sm opacity-75 min-w-[80px]">Dosage: {med.dosage}</div>
                    <div className="font-mono text-sm opacity-75 min-w-[100px]">Freq: {med.frequency}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No medicines detected. Try another image or crosscheck.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

