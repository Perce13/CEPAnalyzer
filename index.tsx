
import React, { useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";

// --- KONFIGURATION & TEXTE ---
const TRANSLATIONS = {
  de: {
    title: "CEP Analyzer",
    subtitle: "Visuelle Szenenanalyse in Anlehnung an das 7W-Framework von ",
    author1: "Jenni Romaniuk",
    and: " und dem ",
    author2: "Ehrenberg-Bass Institute",
    uploadPlaceholder: "Bild hierher ziehen oder klicken",
    safetyNote: "Inhaltsfilter aktiv",
    categoryLabel: "Kategorie (Optional)",
    categoryPlaceholder: "z.B. Kaffee, Snacks, Versicherung...",
    buttonStart: "KI-Analyse starten",
    buttonProcessing: "Analysiere...",
    emptyStateTitle: "Bereit für Analyse",
    emptyStateSub: "Laden Sie eine Szene hoch, um Motive und Kontexte zu identifizieren.",
    summaryTitle: "Zusammenfassung",
    insightTitle: "Strategischer Insight",
    howFeeling: "hoW (Feeling)",
    legalTitle: "Datenschutz & Sicherheit",
    legalText: "Bilder werden nicht gespeichert und nicht für KI-Training verwendet. Die Verarbeitung erfolgt flüchtig im Arbeitsspeicher und wird nach der Sitzung gelöscht.",
    termsTitle: "Richtlinien & AGBS",
    termsText: "Keine pornografischen, gewaltverherrlichenden oder rassistischen Inhalte erlaubt. Die Nutzung erfolgt auf eigene Gefahr. Automatisierte Inhaltsfilter sind aktiv.",
    errorSafety: "Sicherheitsfilter: Inhalt blockiert.",
    errorGeneral: "Analyse fehlgeschlagen (Limit erreicht oder API-Fehler)."
  },
  en: {
    title: "CEP Analyzer",
    subtitle: "Visual scene analysis inspired by the 7W Framework by ",
    author1: "Jenni Romaniuk",
    and: " and the ",
    author2: "Ehrenberg-Bass Institute",
    uploadPlaceholder: "Drag image here or click",
    safetyNote: "Content filter active",
    categoryLabel: "Category (Optional)",
    categoryPlaceholder: "e.g., Coffee, Snacks, Insurance...",
    buttonStart: "Start AI Analysis",
    buttonProcessing: "Analyzing...",
    emptyStateTitle: "Ready to Analyze",
    emptyStateSub: "Upload a scene to identify motives and contexts.",
    summaryTitle: "Summary",
    insightTitle: "Strategic Insight",
    howFeeling: "hoW (Feeling)",
    legalTitle: "Privacy & Security",
    legalText: "Images are not stored and not used for AI training. Processing is transient in memory and deleted after the session ends.",
    termsTitle: "Guidelines & Terms",
    termsText: "No pornographic, violent, or racist content allowed. Use at your own risk. Automated content filters are active.",
    errorSafety: "Safety Filter: Content blocked.",
    errorGeneral: "Analysis failed (Limit reached or API error)."
  }
};

const Logo = () => (
  <div className="flex items-center gap-3">
    <div className="relative w-16 h-8 bg-[#0000FF] rounded-full flex items-center pr-1 justify-end">
      <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
        <div className="w-3 h-3 bg-black rounded-full relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-white"></div>
        </div>
      </div>
    </div>
    <span className="font-black text-lg tracking-widest uppercase text-black">Sighteffect</span>
  </div>
);

const IconChevronDown = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>;

const App = () => {
  const [lang, setLang] = useState<'de' | 'en'>('de');
  const [image, setImage] = useState<string | null>(null);
  const [category, setCategory] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = TRANSLATIONS[lang];

  const processFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResults(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const analyzeImage = async () => {
    if (!image) return;
    setIsAnalyzing(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const base64Data = image.split(',')[1];

      const prompt = `Analyze this image strictly for Category Entry Points (CEPs) using the 7W Framework. 
      Language: ${lang === 'de' ? 'German' : 'English'}. 
      Target Category: "${category || 'Auto-detect'}".
      Fields: why, when, where, while, withWhom, withWhat, how, summary, strategic_insight.
      Keep the analysis professional and strategic for marketers.
      Output JSON.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{
          parts: [
            { text: prompt },
            { inlineData: { mimeType: 'image/jpeg', data: base64Data } }
          ]
        }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              why: { type: Type.STRING },
              when: { type: Type.STRING },
              where: { type: Type.STRING },
              while: { type: Type.STRING },
              withWhom: { type: Type.STRING },
              withWhat: { type: Type.STRING },
              how: { type: Type.STRING },
              summary: { type: Type.STRING },
              strategic_insight: { type: Type.STRING },
              suggested_categories: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["why", "when", "where", "while", "withWhom", "withWhat", "how", "summary", "strategic_insight"]
          }
        }
      });
      
      if (!response.text) throw new Error("API_ERROR");
      setResults(JSON.parse(response.text));
    } catch (err: any) {
      setError(err.message?.includes('SAFETY') ? t.errorSafety : t.errorGeneral);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen">
      <nav className="max-w-7xl mx-auto px-6 py-8 flex justify-between items-center">
        <Logo />
        <button 
          onClick={() => setLang(lang === 'de' ? 'en' : 'de')}
          className="px-4 py-2 border-2 border-black rounded-full font-black text-xs uppercase tracking-widest hover:bg-black hover:text-white transition-all"
        >
          {lang === 'de' ? 'ENGLISH' : 'DEUTSCH'}
        </button>
      </nav>

      <main className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-16 mt-8">
        <header className="lg:col-span-12">
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none mb-6 uppercase">{t.title}</h1>
          <p className="text-xl md:text-2xl font-light text-black/40 leading-relaxed max-w-5xl">
            {t.subtitle} 
            <a href="https://marketingscience.info/who-we-are/our-team/professor-jenni-romaniuk" target="_blank" className="text-black font-bold underline underline-offset-8 hover:text-[#0000FF] transition-colors">{t.author1}</a> 
            {t.and} 
            <a href="https://www.marketingscience.info/" target="_blank" className="text-black font-bold underline underline-offset-8 hover:text-[#0000FF] transition-colors">{t.author2}</a>.
          </p>
        </header>

        <div className="lg:col-span-5 space-y-10">
          <div 
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`aspect-square relative overflow-hidden bg-black/[0.02] border-2 border-dashed transition-all duration-300 ${image ? 'border-solid border-black' : isDragging ? 'border-[#0000FF] bg-[#0000FF]/5 scale-[0.98]' : 'border-black/10 hover:border-black/30 cursor-pointer'}`}
          >
            {image ? (
              <img src={image} className="w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center pointer-events-none">
                <div className={`w-12 h-1.5 mb-8 transition-colors ${isDragging ? 'bg-black' : 'bg-[#0000FF]'}`}></div>
                <span className="text-sm font-black uppercase tracking-[0.2em]">{t.uploadPlaceholder}</span>
                <span className="text-[10px] text-black/30 mt-4 uppercase tracking-widest font-bold">{t.safetyNote}</span>
              </div>
            )}
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-black/40">{t.categoryLabel}</label>
              <input 
                type="text" 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder={t.categoryPlaceholder}
                className="w-full bg-transparent border-b-2 border-black/10 py-4 focus:outline-none focus:border-[#0000FF] transition-colors text-lg font-medium placeholder:text-black/10"
              />
            </div>

            <button 
              disabled={!image || isAnalyzing}
              onClick={analyzeImage}
              className="w-full bg-[#0000FF] py-6 text-white text-sm font-black uppercase tracking-[0.3em] hover:bg-black transition-all disabled:bg-black/10"
            >
              {isAnalyzing ? t.buttonProcessing : t.buttonStart}
            </button>
            {error && <p className="text-center text-xs font-bold text-red-500 tracking-widest uppercase">{error}</p>}
          </div>
        </div>

        <div className="lg:col-span-7">
          {!results && !isAnalyzing ? (
            <div className="h-full min-h-[500px] border-2 border-black/5 bg-black/[0.01] flex flex-col items-center justify-center p-12 text-center">
              <span className="text-5xl font-black text-black/[0.03] uppercase tracking-tighter mb-4">{t.emptyStateTitle}</span>
              <p className="text-xs font-bold text-black/20 uppercase tracking-widest">{t.emptyStateSub}</p>
            </div>
          ) : isAnalyzing ? (
            <div className="space-y-6 animate-pulse">
              <div className="h-32 bg-black/[0.02] border border-black/5"></div>
              <div className="grid grid-cols-1 gap-4">
                {[1,2,3,4,5,6,7].map(i => <div key={i} className="h-20 bg-black/[0.01] border border-black/5"></div>)}
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="bg-[#0000FF] p-10 text-white shadow-2xl">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">{t.summaryTitle}</h3>
                  <div className="flex flex-wrap gap-2">
                    {results.suggested_categories?.map((c: string, i: number) => (
                      <span key={i} className="text-[9px] font-black uppercase tracking-widest border border-white/20 px-2 py-1 rounded-full">{c}</span>
                    ))}
                  </div>
                </div>
                <p className="text-4xl font-medium tracking-tight leading-[1.1]">"{results.summary}"</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <WCard title="Why" content={results.why} />
                <WCard title="When" content={results.when} />
                <WCard title="Where" content={results.where} />
                <WCard title="While" content={results.while} />
                <WCard title="With Whom" content={results.withWhom} />
                <WCard title="With What" content={results.withWhat} />
                <WCard title={t.howFeeling} content={results.how} highlight />
              </div>

              <div className="bg-black p-10 text-white border-l-[12px] border-[#0000FF] shadow-xl">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-6">{t.insightTitle}</h3>
                <p className="text-2xl font-light leading-relaxed">{results.strategic_insight}</p>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="bg-black text-white py-32 mt-32">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-24">
          <div className="space-y-10">
            <Logo />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 leading-loose">
              &copy; {new Date().getFullYear()} CEP ANALYZER.<br/>
              POWERED BY SIGHTEFFECT.
            </p>
          </div>
          <div className="space-y-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#0000FF]">{t.legalTitle}</h4>
            <p className="text-sm text-white/50 leading-relaxed font-light">{t.legalText}</p>
          </div>
          <div className="space-y-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#0000FF]">{t.termsTitle}</h4>
            <p className="text-sm text-white/50 leading-relaxed font-light">{t.termsText}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

const WCard = ({ title, content, highlight }: { title: string; content: string; highlight?: boolean }) => {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div className={`border-2 transition-all duration-300 ${highlight ? 'border-[#0000FF] bg-[#0000FF]/[0.02]' : 'border-black/5 hover:border-black/10 bg-white'}`}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 focus:outline-none"
      >
        <span className={`text-[11px] font-black uppercase tracking-[0.2em] ${highlight ? 'text-[#0000FF]' : 'text-black/30'}`}>{title}</span>
        <div className={`transition-transform duration-500 ${isOpen ? 'rotate-180' : ''} text-black/10`}>
          <IconChevronDown />
        </div>
      </button>
      <div className={`overflow-hidden transition-all duration-500 ${isOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'}`}>
        <p className="px-6 pb-8 pt-0 text-base text-black/70 leading-relaxed font-normal">{content}</p>
      </div>
    </div>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(<App />);
}
