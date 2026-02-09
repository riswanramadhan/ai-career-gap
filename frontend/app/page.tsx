// app/page.tsx
"use client";
import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";

interface LearningStep {
  title: string;
  description: string;
}

interface AnalysisResult {
  id: string;
  createdAt: string;
  missingSkills: string[];
  learningSteps: LearningStep[];
  interviewQuestions: string[];
  cached?: boolean;
}

interface ApiError {
  error: string;
  code?: string;
}

// Theme Toggle Component
function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = savedTheme || (prefersDark ? "dark" : "light");
    setTheme(initialTheme);
    document.documentElement.setAttribute("data-theme", initialTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  };

  if (!mounted) return null;

  return (
    <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle theme" title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}>
      {theme === "light" ? (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      ) : (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )}
    </button>
  );
}

// Loading Button Content
function LoadingContent() {
  return (
    <div className="btn-content">
      <div className="loading-dots">
        <div className="loading-dot"></div>
        <div className="loading-dot"></div>
        <div className="loading-dot"></div>
      </div>
      <span>AI is analyzing...</span>
    </div>
  );
}

// Main Component
export default function Home() {
  const [resume, setResume] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);
    setShowResult(false);

    try {
      const res = await fetch("http://localhost:5000/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: resume,
          jobDescText: jobDesc,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorData = data as ApiError;
        throw new Error(errorData.error || "Something went wrong");
      }

      if (!data.missingSkills || !data.learningSteps || !data.interviewQuestions) {
        throw new Error("Invalid response format from server");
      }

      setResult(data as AnalysisResult);
      setTimeout(() => setShowResult(true), 100);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setResume("");
    setJobDesc("");
    setResult(null);
    setError(null);
    setShowResult(false);
  };

  const isValid = resume.length >= 50 && jobDesc.length >= 50;

  return (
    <div className="page-wrapper">
      {/* Animated Background */}
      <div className="animated-bg" />
      
      {/* Theme Toggle */}
      <ThemeToggle />

      <main className="page-main">
        {/* Header */}
        <header className="page-header animate-fade-in-up">
          <div className="header-badge">
            <span className="badge-dot"></span>
            <span className="badge-text">AI-Powered Career Analysis</span>
          </div>
          
          <h1 className="heading-xl" style={{ marginBottom: '16px' }}>
            Bridge Your <span className="text-gradient">Career Gap</span>
          </h1>
          
          <p className="header-subtitle">
            Upload your resume and target job description. Our AI will analyze the gaps and create a personalized learning roadmap for you.
          </p>
        </header>

        {/* Main Content */}
        <div className="page-container">
          {/* Input Form */}
          <div className="glass-card p-6 sm:p-8 mb-8 animate-fade-in-up delay-100" style={{ opacity: 0, animationFillMode: 'forwards' }}>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Resume Input */}
                <div className="input-wrapper">
                  <label className="input-label">Your Resume</label>
                  <textarea
                    className="framer-input h-80"
                    placeholder="Paste your resume content here. (Your work experience, Skills and technologies, Education and certifications)"
                    value={resume}
                    onChange={(e) => setResume(e.target.value)}
                    required
                  />
                  <span className="char-count">{resume.length} chars</span>
                </div>

                {/* Job Description Input */}
                <div className="input-wrapper">
                  <label className="input-label">Target Job Description</label>
                  <textarea
                    className="framer-input h-80"
                    placeholder="Paste the job description here. (Job requirements, Required skills & qualifications, Responsibilities)"
                    value={jobDesc}
                    onChange={(e) => setJobDesc(e.target.value)}
                    required
                  />
                  <span className="char-count">{jobDesc.length} chars</span>
                </div>
              </div>

              {/* Validation Message */}
              {(resume.length > 0 && resume.length < 50) || (jobDesc.length > 0 && jobDesc.length < 50) ? (
                <p style={{ color: 'var(--warning)', fontSize: '14px', marginBottom: '16px', textAlign: 'center' }}>
                  ⚠️ Please provide at least 50 characters for both fields
                </p>
              ) : null}

              {/* Action Buttons */}
              <div className="form-actions">
                <button
                  type="submit"
                  disabled={loading || !isValid}
                  className={`btn-primary flex-1 ${loading ? 'analyzing-animation' : ''}`}
                >
                  {loading ? (
                    <LoadingContent />
                  ) : (
                    <span className="btn-content">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Analyze Gap
                    </span>
                  )}
                </button>
                
                {(resume || jobDesc) && !loading && (
                  <button type="button" onClick={clearForm} className="btn-secondary">
                    Clear All
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="error-alert error-box">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Results */}
          {result && showResult && (
            <div className="results-container">
              {/* Cache Indicator */}
              {result.cached && (
                <div className="flex justify-center animate-fade-in">
                  <div className="cache-indicator">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                    </svg>
                    <span>Loaded from cache (instant)</span>
                  </div>
                </div>
              )}

              {/* Missing Skills Section */}
              <section className="glass-card p-8 animate-fade-in-up" style={{ opacity: 0, animationFillMode: 'forwards', marginTop: '24px', marginBottom: '24px' }}>
                <div className="section-header">
                  <div className="section-icon danger">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="section-title">Skill Gaps Detected</h2>
                    <p className="section-subtitle">Technologies required but missing from your resume</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  {result.missingSkills.map((skill, idx) => (
                    <span 
                      key={idx} 
                      className="skill-badge"
                      style={{ animationDelay: `${idx * 0.1}s` }}
                    >
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      {skill}
                    </span>
                  ))}
                </div>
              </section>

              {/* Learning Path Section */}
              <section className="glass-card p-8 animate-fade-in-up delay-200" style={{ opacity: 0, animationFillMode: 'forwards' }}>
                <div className="section-header">
                  <div className="section-icon primary">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="section-title">Learning Roadmap</h2>
                    <p className="section-subtitle">3 concrete steps to bridge your skill gaps</p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {result.learningSteps.map((step, idx) => (
                    <div 
                      key={idx} 
                      className="step-card animate-slide-in"
                      style={{ animationDelay: `${(idx + 1) * 0.15}s`, opacity: 0, animationFillMode: 'forwards' }}
                    >
                      <div className="step-number">{idx + 1}</div>
                      <h3 className="step-title">{step.title}</h3>
                      <div className="step-description markdown-content">
                        <ReactMarkdown>{step.description}</ReactMarkdown>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Interview Questions Section */}
              <section className="glass-card p-8 animate-fade-in-up delay-300" style={{ opacity: 0, animationFillMode: 'forwards' }}>
                <div className="section-header">
                  <div className="section-icon success">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="section-title">Interview Prep</h2>
                    <p className="section-subtitle">Questions targeting your identified gaps</p>
                  </div>
                </div>
                <div className="grid gap-4">
                  {result.interviewQuestions.map((question, idx) => (
                    <div 
                      key={idx} 
                      className="question-card animate-scale-in"
                      style={{ animationDelay: `${(idx + 1) * 0.12}s`, opacity: 0, animationFillMode: 'forwards' }}
                    >
                      <div className="question-number">Q{idx + 1}</div>
                      <div className="question-text markdown-content">
                        <ReactMarkdown>{question}</ReactMarkdown>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Footer Info */}
              <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', padding: '24px 0' }}>
                <p>Analysis ID: {result.id}</p>
                <p>Generated: {new Date(result.createdAt).toLocaleString()}</p>
              </div>
            </div>
          )}

          {/* Features Section (shown when no result) */}
          {!result && !loading && (
            <section className="features-grid animate-fade-in-up delay-300" style={{ opacity: 0, animationFillMode: 'forwards' }}>
              <h2 className="heading-md features-title">How it works</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="feature-card">
                  <div className="feature-icon">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <h3 className="feature-title">Skill Gap Analysis</h3>
                  <p className="feature-description">
                    AI identifies missing skills between your resume and target job requirements
                  </p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <h3 className="feature-title">Learning Path</h3>
                  <p className="feature-description">
                    Get actionable steps with specific project recommendations to upskill
                  </p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="feature-title">Interview Prep</h3>
                  <p className="feature-description">
                    Practice with targeted questions focusing on your identified skill gaps
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="page-footer">
        <p className="footer-title">Built with AI • Career Gap Architect</p>
        <p className="footer-copy">© {new Date().getFullYear()} Riswan Ramadhan. All rights reserved.</p>
      </footer>
    </div>
  );
}
