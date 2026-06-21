import React, { useState } from "react";
import {
  Stethoscope,
  Clipboard,
  Check,
  AlertTriangle,
  AlertOctagon,
  XCircle,
  RotateCcw,
  Info,
  ShieldCheck,
  Sparkles,
  FileText,
  Clock,
  ArrowRight,
  ExternalLink
} from "lucide-react";

// Predefined examples with actual realistic clinical copy
const EXAMPLE_PRE_ECLAMPSIA = `GP Referral Letter
Date: 2026-06-15
Patient: Sarah Jenkins (DOB: 12/08/1997)
Gestational Age: 14 weeks based on previous dating scan.
Parity: G2P1.

Dear Antenatal Intake Clinic,
I am referring Sarah Jenkins to your care for her second pregnancy. Her previous pregnancy in 2023 was complicated by severe pre-eclampsia which required magnesium sulfate infusion and induction at 36 weeks. She is currently asymptomatic but has a strong family history of maternal hypertension. 
Vitals in clinic today: BP is 125/80 mmHg, urinalysis is normal (no proteinuria). BMI is 24.
She is keen for consultant-led clinic care.
Kind regards,
Dr. Allison (M.B.B.S)`;

const EXAMPLE_GDM_HISTORY = `Antenatal Intake Referral
Date: 2026-06-18
Patient: Priya Patel (DOB: 05/04/1994)
Gestational Age: 12 weeks 3 days by LMP. 
Parity: G3P2.

Dear Intake Midwife,
I would like to refer Priya Patel for consultant/obstetrics antenatal booking. She is a 32-year-old G3P2 who lists a history of Gestational Diabetes Mellitus (GDM) in both of her prior pregnancies. During her last pregnancy, she required treatment with morning insulin doses.
Her pre-pregnancy BMI is 31.2 kg/m². Fasting blood glucose from her early screening today is currently pending.
Otherwise, she reports feeling well. No other medical history of note.
Thank you,
Dr. Smith (General Practitioner)`;

const EXAMPLE_MISSING_DATES = `Antenatal Care Booking Request
Date: 2026-06-12
Patient: Chloe Davis, age 29.

Dear Antenatal team,
We have confirmed a positive urine HCG test for Chloe Davis today in our practice. She is eager to start her antenatal care.
However, she is uncertain of her Last Menstrual Period (LMP) and has not had any dating ultrasound scans completed yet. No estimated date of delivery (EDD) has been calculated.
She has no significant medical, surgical or psychological history. She has a normal BMI. BP in clinic today is 110/70.
Please initiate booking and coordinate her dating investigation.
Sincerely,
Dr. Thomas`;

const EXAMPLE_REDUCED_MOVEMENTS = `URGENT ANTENATAL REVIEW REQUEST
Date: 2026-06-20
Patient: Amy Taylor (DOB: 22/10/1995)
Gestational Age: 31 weeks 4 days.
Parity: G1P0.

Dear Clinic Obstetrician / Senior Coordinator,
I am referring Amy Taylor for immediate review. She presented to our clinic today with concerns regarding reduced fetal movements lasting for the past 24 hours. She has felt only 1-2 subtle flutters since yesterday morning.
She also mentions mild, vague lower abdominal cramping, but denies any vaginal bleeding, active labor pain, or fluid loss.
Vitals: BP is 118/76, pulse is 82 bpm. Symphysis-fundal height is 30cm.
Please arrange for urgent physical assessment and cardiotocograph (CTG) today.
Best regards,
Dr. Green (M.B.B.S, FAMed)`;

interface ReviewResult {
  referralSummary: string;
  possibleRisks: string[];
  missingInfo: string[];
  suggestedPriority: "Routine review likely appropriate" | "Consider earlier review by senior clinician" | "Escalate promptly for senior clinical review";
  guidelineRationale: string;
  recommendedNextSteps: string[];
  safetyNote: string;
}

export default function App() {
  const [referralText, setReferralText] = useState("");
  const [agreedToDisclaimer, setAgreedToDisclaimer] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Set predefined example text
  const loadExample = (text: string) => {
    setReferralText(text);
    setError(null);
  };

  // Perform referral analysis API call
  const handleReviewReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referralText.trim()) {
      setError("Please paste or load a GP referral letter.");
      return;
    }
    if (!agreedToDisclaimer) {
      setError("You must acknowledge that all outputs require clinical review before analyzing.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/review-referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referralText })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to analyze the referral text.");
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected network error occurred. Please check database/API connection.");
    } finally {
      setIsLoading(false);
    }
  };

  // Actions
  const clearReferral = () => {
    setReferralText("");
    setResult(null);
    setError(null);
    setAgreedToDisclaimer(false);
  };

  const copyToClipboard = () => {
    if (!result) return;
    const formattedText = `--- ANTENATAL REFERRAL RISK REVIEW ---
SUGGESTED INTENSITY PRIORITY:
→ [ ${result.suggestedPriority.toUpperCase()} ]

CLINICAL REFERRAL SUMMARY:
${result.referralSummary}

POSSIBLE PREGNANCY RISK FACTORS:
${result.possibleRisks.length > 0 ? result.possibleRisks.map((r, i) => `- ${r}`).join("\n") : "None stated or identified"}

MISSING OR UNCLEAR INFORMATION:
${result.missingInfo.length > 0 ? result.missingInfo.map((m, i) => `- ${m}`).join("\n") : "None identified as missing"}

GUIDELINE-BASED RATIONALE:
${result.guidelineRationale}

RECOMMENDED NEXT ACTIONS:
${result.recommendedNextSteps.length > 0 ? result.recommendedNextSteps.map((n, i) => `${i + 1}. ${n}`).join("\n") : "Confirm local procedure."}

SAFETY NOTE:
${result.safetyNote}

----------------------------------------
Disclaimer: Educational support only. This does not replace clinical judgment.
PHCA8010 Digital Health Prototype
Date Reviewed: ${new Date().toLocaleDateString()}
`;

    navigator.clipboard.writeText(formattedText)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2500);
      })
      .catch((err) => {
        console.error("Clipboard copy failed: ", err);
      });
  };

  // Helper colors for prioritized cards
  const getPriorityColors = (priority: string) => {
    switch (priority) {
      case "Escalate promptly for senior clinical review":
        return {
          banner: "bg-red-50 text-red-900 border-red-200",
          badge: "bg-red-600 text-white",
          text: "text-red-700",
          border: "border-red-300",
          accent: "red"
        };
      case "Consider earlier review by senior clinician":
        return {
          banner: "bg-amber-50 text-amber-900 border-amber-200",
          badge: "bg-amber-500 text-slate-950",
          text: "text-amber-700",
          border: "border-amber-300",
          accent: "amber"
        };
      default:
        return {
          banner: "bg-emerald-50 text-emerald-900 border-emerald-200",
          badge: "bg-emerald-600 text-white",
          text: "text-emerald-700",
          border: "border-emerald-300",
          accent: "emerald"
        };
    }
  };

  const priorityMeta = result ? getPriorityColors(result.suggestedPriority) : null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex flex-col antialiased">
      {/* Top Professional Executive Header */}
      <header className="bg-[#0F172A] border-b border-slate-800 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-lg flex items-center justify-center shadow-inner">
              <Stethoscope className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-xs font-mono text-blue-400 tracking-wider uppercase block">PHCA8010 Digital Suite</span>
              <h1 className="text-xl sm:text-2xl font-display font-bold text-white tracking-tight">
                Antenatal Referral Risk Assistant
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/40 text-blue-300 border border-blue-800">
              Clinical Support Tool
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300">
              v1.0.0 (MVP)
            </span>
          </div>
        </div>
      </header>

      {/* Top Mandatory Safety Disclaimer */}
      <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-3 sm:px-6 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-start gap-3">
          <div className="p-0.5 mt-0.5 flex-shrink-0 text-amber-700">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <p className="text-xs sm:text-sm font-medium leading-relaxed">
            <strong className="text-amber-950 font-bold">Important Clinical Notice:</strong> Educational referral review support only. This tool does not diagnose, treat, or replace clinical judgement. All outputs must be checked by a qualified clinician. If urgent symptoms are present, follow local emergency and escalation protocols immediately.
          </p>
        </div>
      </div>

      {/* Main Grid Layout */}
      <main className="flex-grow max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Inputs, Examples and Guidelines */}
        <div className="lg:col-span-5 space-y-6 flex flex-col">
          
          {/* Main Referral Input Form */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 sm:p-6 flex flex-col flex-grow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-display font-semibold text-slate-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" aria-hidden="true" />
                Referral Intake Letter
              </h2>
              <span className="text-xs text-slate-400 font-mono">GP Referral Paste Area</span>
            </div>

            <form onSubmit={handleReviewReferral} className="space-y-4 flex flex-col flex-grow">
              <div className="relative">
                <label htmlFor="referral-text" className="sr-only">Paste Antenatal Referral Letter</label>
                <textarea
                  id="referral-text"
                  rows={14}
                  className="w-full rounded-lg border border-slate-300 p-4 text-sm font-mono placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 text-slate-800 transition-colors resize-y leading-relaxed"
                  placeholder="Paste unstructured GP referral letter text here..."
                  value={referralText}
                  onChange={(e) => {
                    setReferralText(e.target.value);
                    if (error && e.target.value.trim()) setError(null);
                  }}
                />
                
                {/* Confidence Warning Box Inside Form */}
                <div className="mt-2 bg-slate-100/80 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-slate-800 font-semibold">Loss of fidelity check:</strong> AI output may be incomplete if the referral letter is incomplete. Missing information should be checked manually.
                  </span>
                </div>
              </div>

              {/* Safety Prototype Declaration Checkbox */}
              <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    id="disclaimer-checkbox"
                    checked={agreedToDisclaimer}
                    onChange={(e) => setAgreedToDisclaimer(e.target.checked)}
                    className="h-4 w-4 mt-1 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <span className="text-xs sm:text-sm text-slate-700 leading-normal">
                    I understand this is a prototype and all outputs require senior clinical review.
                  </span>
                </label>
              </div>

              {/* Error Alert Box */}
              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-lg text-xs leading-relaxed flex items-start gap-2">
                  <XCircle className="h-4.5 w-4.5 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div>{error}</div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={clearReferral}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:text-slate-900 transition-colors focus:ring-2 focus:ring-slate-500"
                >
                  <RotateCcw className="h-4 w-4" />
                  Clear Referral
                </button>

                <button
                  type="submit"
                  disabled={isLoading || !agreedToDisclaimer}
                  className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 ${
                    !agreedToDisclaimer 
                      ? "bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed"
                      : "bg-blue-700 text-white hover:bg-blue-800 shadow-sm focus:ring-2 focus:ring-blue-500 filter hover:brightness-105 active:scale-[0.98]"
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Clock className="h-4 animate-spin text-white" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4" />
                      Review Referral
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Quick Pre-fill Library (Examples) */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h3 className="text-sm font-display font-bold text-slate-900 tracking-wide uppercase mb-3 text-slate-500">
              Interactive Clinical Scenarios
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Select one of the validated midwife-intake letters to populate the evaluation engine:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => loadExample(EXAMPLE_PRE_ECLAMPSIA)}
                className="text-left p-3 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all text-xs"
              >
                <div className="font-semibold text-slate-900 mb-0.5">1. Prev Pre-eclampsia</div>
                <div className="text-slate-500 line-clamp-1">Sarah Jenkins • 14 weeks G2P1</div>
              </button>

              <button
                type="button"
                onClick={() => loadExample(EXAMPLE_GDM_HISTORY)}
                className="text-left p-3 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all text-xs"
              >
                <div className="font-semibold text-slate-900 mb-0.5">2. History of GDM</div>
                <div className="text-slate-500 line-clamp-1">Priya Patel • 12 weeks G3P2</div>
              </button>

              <button
                type="button"
                onClick={() => loadExample(EXAMPLE_MISSING_DATES)}
                className="text-left p-3 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all text-xs"
              >
                <div className="font-semibold text-slate-900 mb-0.5">3. Missing Dates</div>
                <div className="text-slate-500 line-clamp-1">Chloe Davis • No LMP/EDD scan</div>
              </button>

              <button
                type="button"
                onClick={() => loadExample(EXAMPLE_REDUCED_MOVEMENTS)}
                className="text-left p-3 rounded-lg border-rose-200 hover:border-rose-400 hover:bg-rose-50/50 transition-all text-xs bg-rose-50/20"
              >
                <div className="font-semibold text-rose-900 mb-0.5 flex items-center gap-1">
                  4. Red Flag (Reduced MV)
                </div>
                <div className="text-slate-500 line-clamp-1">Amy Taylor • 31 weeks G1P0</div>
              </button>
            </div>
          </div>

          {/* Golden Source Information Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5">
            <h4 className="text-xs font-display font-extrabold text-slate-900 tracking-wider uppercase mb-1.5 flex items-center gap-1.5 text-slate-600">
              <Info className="h-4 w-4 text-blue-600" />
              Golden Source Grounding
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Golden Source used for this prototype: SA Health Perinatal Practice Guidelines and Australian Pregnancy Care Guidelines. This prototype uses these sources for educational grounding only and must still be checked against local hospital policy and senior clinician judgement.
            </p>
          </div>
          
        </div>

        {/* Right Side: Analysis Output Panel */}
        <div className="lg:col-span-7 flex flex-col">
          
          {/* Loading state placeholders */}
          {isLoading && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8 flex-grow flex flex-col justify-center items-center min-h-[400px] space-y-6">
              <div className="relative flex items-center justify-center">
                <div className="animate-ping absolute inline-flex h-12 w-12 rounded-full bg-blue-100 opacity-75"></div>
                <div className="relative rounded-full p-4 bg-blue-50 text-blue-600 border border-blue-200">
                  <Stethoscope className="h-8 w-8 animate-pulse" />
                </div>
              </div>
              <div className="text-center space-y-2 max-w-sm">
                <h3 className="text-lg font-display font-semibold text-slate-900 animate-pulse">Evaluating Referral Safety Profile</h3>
                <p className="text-sm text-slate-500">
                  Extracting patient details, cross-checking warning signs, flagging missing values, and generating guideline-referenced suggestions...
                </p>
              </div>
              {/* Dummy skeleton UI */}
              <div className="w-full space-y-3 pt-6 border-t border-slate-100">
                <div className="h-6 bg-slate-100 rounded w-1/3 animate-pulse"></div>
                <div className="h-16 bg-slate-100 rounded animate-pulse"></div>
                <div className="h-20 bg-slate-100 rounded animate-pulse"></div>
              </div>
            </div>
          )}

          {/* Empty PlaceHolder */}
          {!isLoading && !result && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8 flex-grow flex flex-col justify-center items-center text-center min-h-[400px]">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-full text-slate-400 mb-4">
                <FileText className="h-10 w-10" />
              </div>
              <h3 className="text-lg font-display font-semibold text-slate-900 mb-2">Awaiting Evaluation</h3>
              <p className="text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
                Paste a GP clinical letter or load an interactive scenario on the left, check the midwife intake understanding, and click <strong className="text-slate-700">"Review Referral"</strong> to review the safety analysis, risk profile, and guidelines.
              </p>
              <div className="border border-dashed border-slate-200 rounded-lg p-4 bg-slate-50/50 max-w-md text-left">
                <h4 className="text-xs font-semibold text-slate-705 uppercase tracking-wider mb-2 flex items-center gap-1 text-slate-500">
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
                  Rigorous Safety Guardrails Included
                </h4>
                <ul className="text-xs text-slate-500 space-y-1.5 list-disc list-inside">
                  <li>Identifies LMP / scan gaps instantaneously</li>
                  <li>Flags pre-eclampsia prompts & GDM history immediately</li>
                  <li>Flags reduced fetal movements for rapid priority routing</li>
                  <li>Prevents definitive diagnoses to keep final decisions with midwives</li>
                </ul>
              </div>
            </div>
          )}

          {/* Real Analysis Output UI */}
          {!isLoading && result && (
            <div className="space-y-6 flex-grow flex flex-col">
              
              {/* Priority Banner Header */}
              <div className={`p-5 rounded-xl border shadow-sm ${priorityMeta?.banner} transition-all`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-xs font-mono tracking-wider uppercase opacity-85 block">Suggested Intake Review Priority</span>
                    <h3 className="text-lg sm:text-xl font-display font-bold text-slate-950">
                      {result.suggestedPriority}
                    </h3>
                  </div>
                  <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm self-start sm:self-center ${priorityMeta?.badge}`}>
                    {result.suggestedPriority === "Escalate promptly for senior clinical review" ? "Urgent / Red Flag" : result.suggestedPriority === "Consider earlier review by senior clinician" ? "Earlier Action Recommended" : "Routine Priority"}
                  </span>
                </div>
              </div>

              {/* Sub grid cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. Referral Summary */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-display font-bold uppercase text-slate-500 tracking-wider mb-2.5 flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-blue-500" />
                      Referral Extraction
                    </h4>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {result.referralSummary}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 mt-4 block">Grounding check complete</span>
                </div>

                {/* 2. Flagged Potential Risks */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-display font-bold uppercase text-slate-500 tracking-wider mb-2.5 flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      Possible Risks Identified
                    </h4>
                    {result.possibleRisks.length > 0 ? (
                      <ul className="space-y-2">
                        {result.possibleRisks.map((risk, index) => (
                          <li key={index} className="text-sm text-slate-700 flex items-start gap-2">
                            <span className="h-2 w-2 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                            <span>{risk}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-500 italic">
                        Not stated in referral or no specific risk factor identified.
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 mt-4 block">Cautious terminology enforced</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 3. Missing or Unclear Information */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-display font-bold uppercase text-slate-500 tracking-wider mb-2.5 flex items-center gap-1.5">
                      <AlertOctagon className="h-4 w-4 text-orange-500" />
                      Missing / Unclear Information
                    </h4>
                    {result.missingInfo.length > 0 ? (
                      <ul className="space-y-2">
                        {result.missingInfo.map((item, index) => (
                          <li key={index} className="text-sm text-slate-700 flex items-start gap-2 bg-orange-50/40 p-1.5 rounded border border-orange-100/50">
                            <span className="text-orange-600 font-bold text-xs mt-0.5">⚠️</span>
                            <span className="text-slate-800 text-xs sm:text-sm font-medium">{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-500 italic">
                        No missing information flagged by engine.
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 mt-4 block">Verify details on booking scan</span>
                </div>

                {/* 4. Suggested Guideline Rationale */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-display font-bold uppercase text-slate-500 tracking-wider mb-2.5 flex items-center gap-1.5">
                      <Info className="h-4 w-4 text-emerald-500" />
                      Guideline-Based Rationale
                    </h4>
                    <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-150">
                      {result.guidelineRationale}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 mt-4 block">Corroborate with local maternity procedure</span>
                </div>
              </div>

              {/* Next Steps List */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                <h4 className="text-sm font-display font-bold uppercase text-slate-500 tracking-wider mb-3.5 flex items-center gap-1.5">
                  <Check className="h-4.5 w-4.5 text-blue-600" />
                  Recommended Intake Checklist
                </h4>
                {result.recommendedNextSteps.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {result.recommendedNextSteps.map((step, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-blue-50/40 border border-blue-100/60">
                        <span className="bg-blue-600 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold mt-0.5 flex-shrink-0">
                          {index + 1}
                        </span>
                        <span className="text-xs sm:text-sm text-slate-700 font-medium leading-normal">{step}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">No checklist items recommended.</p>
                )}
              </div>

              {/* Output Safety Note Banner */}
              <div className="bg-slate-100 border border-slate-300 rounded-xl p-4 flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-slate-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-0.5">Evaluator Safety Warning:</h5>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {result.safetyNote}
                  </p>
                </div>
              </div>

              {/* Toolbar Actions */}
              <div className="border-t border-slate-200 pt-4 flex flex-wrap justify-between items-center gap-3">
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Info className="h-3.5 w-3.5" />
                  Format structured data safely before copying to external EHR portal lists.
                </p>

                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-all duration-150 shadow-sm transform active:scale-95"
                >
                  {copySuccess ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-400" />
                      <span className="text-emerald-300">Copied to Notes!</span>
                    </>
                  ) : (
                    <>
                      <Clipboard className="h-4 w-4" />
                      Copy summary for notes
                    </>
                  )}
                </button>
              </div>

            </div>
          )}
        </div>
      </main>

      {/* Bottom Medical Disclaimer & Branding Footer */}
      <footer className="mt-auto bg-[#0F172A] text-slate-400 text-xs py-8 border-t border-slate-850">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          
          {/* Bottom Mirror Disclaimer */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 text-left">
            <h6 className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1.5 flex items-center gap-1.5 font-bold">
              <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
              Safety Declaration & Core Grounding Notice
            </h6>
            <p className="leading-relaxed text-[11px] text-slate-400">
              Educational referral review support only. Backed by educational reference to SA Health Perinatal Practice Guidelines and Australian Pregnancy Care Guidelines. This tool does not diagnose, treat, or replace clinical judgement. All outputs must be checked by a qualified clinician against local hospital policy and senior clinician judgement. If urgent symptoms are present, follow local emergency and escalation protocols immediately. Prototype developed for PHCA8010 Digital Health for Practitioners.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-blue-500" />
              <span className="font-display font-medium text-slate-300">PHCA8010 Digital Health Suite</span>
            </div>
            <p className="text-slate-500 text-[11px]">
              Prototype developed for PHCA8010 Digital Health for Practitioners.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
