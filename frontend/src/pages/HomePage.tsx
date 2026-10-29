import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Compass,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  TrendingUp,
  Brain,
  FileText,
  Video,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { HealthStatusWidget } from '../components/features/HealthStatusWidget';
import { Footer } from '../components/layout/Footer';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const benefits = [
    {
      icon: <Brain className="w-5 h-5 text-indigo-600" />,
      title: 'Actionable Skill Gap Diagnostics',
      description:
        'Instead of generic advice, our algorithm analyzes your real coursework and GitHub repos against 1,000+ live job specs to identify precise deficiencies.',
    },
    {
      icon: <TrendingUp className="w-5 h-5 text-emerald-600" />,
      title: 'Adaptive Placement Roadmaps',
      description:
        'Structured week-by-week milestones tailored to your target graduation date, covering DSA, full-stack development, and system design topics.',
    },
    {
      icon: <FileText className="w-5 h-5 text-blue-600" />,
      title: 'ATS-Proof Resume Optimization',
      description:
        'Instant analysis score measuring keyword coverage, action-verb density, and quantifiable impact bullets that pass initial recruiter filters.',
    },
    {
      icon: <Video className="w-5 h-5 text-purple-600" />,
      title: 'AI Mock Technical Interviews',
      description:
        'Realistic simulation of technical coding and behavioral STAR rounds with instant feedback on algorithm complexity and communication clarity.',
    },
  ];

  const workflowSteps = [
    {
      step: '01',
      title: 'Profile & Skills Intake',
      description: 'Enter your university, graduation term, coursework, and current programming proficiencies.',
    },
    {
      step: '02',
      title: 'Market Match & Gap Scan',
      description: 'The platform benchmarks your profile against active roles at companies like Stripe, Datadog, and Google.',
    },
    {
      step: '03',
      title: 'Targeted Skill Acquisition',
      description: 'Execute curated milestone projects, practice interview questions, and build portfolio-grade artifacts.',
    },
    {
      step: '04',
      title: 'Track, Interview & Land Offers',
      description: 'Organize applications on your Kanban tracker, prepare with mock sessions, and secure placements.',
    },
  ];

  const faqs = [
    {
      q: 'How does Career Pilot AI assess my skill gaps?',
      a: 'We evaluate your self-reported skills, projects, and coursework against parsed requirement models derived from thousands of engineering job postings. The system distinguishes between "Critical Requirements" and "Good-to-Have" skills.',
    },
    {
      q: 'Is this only for Computer Science students?',
      a: 'While our initial focus is on software engineering, cloud systems, and data roles, our roadmap engine accommodates students from Information Technology, Electrical Engineering, and related computing majors.',
    },
    {
      q: 'How does the provider-independent AI integration work?',
      a: 'Our backend uses an adapter abstraction pattern. By default, it operates in an intelligent offline simulation mode for seamless local development, and can connect directly to Google Gemini or OpenAI with zero code changes.',
    },
    {
      q: 'Can I export my resume directly from the platform?',
      a: 'Yes! The ATS Resume Builder lets you edit all sections with live preview, evaluates your score against job descriptions, and allows one-click PDF printing and markdown export.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
              <Compass className="w-5 h-5" />
            </div>
            <span className="font-bold text-slate-900 text-lg tracking-tight">Career Pilot AI</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#benefits" className="hover:text-slate-900">Benefits</a>
            <a href="#workflow" className="hover:text-slate-900">Workflow</a>
            <a href="#telemetry" className="hover:text-slate-900">System Health</a>
            <a href="#faqs" className="hover:text-slate-900">FAQs</a>
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
              Sign In
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate('/dashboard')}>
              Open Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Empowering College Students for Placement Season 2026-2027
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] max-w-4xl mx-auto">
            Your Autonomous AI Career &{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-500">
              Placement Preparation Agent
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Analyze your technical competencies, uncover target skill gaps, follow personalized learning roadmaps,
            craft ATS resumes, and practice technical interviews.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button
              size="lg"
              variant="primary"
              onClick={() => navigate('/onboarding')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Start Student Onboarding
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/dashboard')}
              leftIcon={<Compass className="w-4 h-4" />}
            >
              Explore Live Demo Dashboard
            </Button>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-medium">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Free for Undergrads
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 100+ Verified Career Tracks
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Interactive Mock Technical Rounds
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Kanban Placement Tracker
            </span>
          </div>

          {/* Interactive Preview Teaser Card */}
          <div className="mt-12 max-w-5xl mx-auto p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xl text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-400"></span>
                <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
                <span className="text-xs font-mono text-slate-400 ml-2">career-pilot-ai-agent.preview</span>
              </div>
              <Badge variant="success" size="sm" dot>Live Campus Readiness Engine</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-xs font-semibold text-slate-500 uppercase">Target Role Fit</div>
                <div className="text-2xl font-bold text-slate-900 mt-1">Full-Stack SDE (84%)</div>
                <div className="text-xs text-emerald-600 mt-1">High demand in campus drives</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-xs font-semibold text-slate-500 uppercase">Active Sprint</div>
                <div className="text-2xl font-bold text-slate-900 mt-1">System Design & APIs</div>
                <div className="text-xs text-indigo-600 mt-1">Milestone 2 of 4 (62% complete)</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-xs font-semibold text-slate-500 uppercase">Tracked Placements</div>
                <div className="text-2xl font-bold text-slate-900 mt-1">6 Applications</div>
                <div className="text-xs text-amber-600 mt-1">2 upcoming technical rounds</div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="benefits" className="py-16 bg-white border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600">Product Benefits</h2>
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                Engineered to Solve the Campus-to-Corporate Disconnect
              </h3>
              <p className="mt-3 text-slate-600 text-sm leading-relaxed">
                Most students struggle with placement uncertainty. Career Pilot AI replaces guesswork with
                concrete, data-driven milestones.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((b, i) => (
                <div key={i} className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center mb-4 shadow-2xs">
                    {b.icon}
                  </div>
                  <h4 className="font-bold text-slate-900 text-base">{b.title}</h4>
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed">{b.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Workflow Section */}
        <section id="workflow" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600">How It Works</h2>
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Your 4-Stage Campus Placement Journey
            </h3>
            <p className="mt-3 text-slate-600 text-sm leading-relaxed">
              Step-by-step guidance designed to keep you focused during critical placement semesters.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
            {workflowSteps.map((step, idx) => (
              <div key={idx} className="relative p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
                <div>
                  <span className="text-3xl font-black text-indigo-600/30 font-mono">{step.step}</span>
                  <h4 className="text-base font-bold text-slate-900 mt-2">{step.title}</h4>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Live System Telemetry */}
        <section id="telemetry" className="py-16 bg-white border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600">Infrastructure Health</h2>
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
                Real-Time Backend & Database Verification
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Monitors MongoDB persistence, API latency, and provider-independent LLM status.
              </p>
            </div>
            <HealthStatusWidget />
          </div>
        </section>

        {/* FAQs */}
        <section id="faqs" className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600">Frequently Asked Questions</h2>
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Everything You Need to Know
            </h3>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div key={idx} className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between text-sm font-semibold text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA Banner */}
        <section className="py-16 bg-slate-900 text-white text-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/30">
              <Compass className="w-6 h-6" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Ready to Accelerate Your Placement Preparation?
            </h2>
            <p className="text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
              Get an instant skill-gap audit, build your personalized learning roadmap, and step into campus placement
              interviews with confidence.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" variant="primary" onClick={() => navigate('/register')}>
                Create Free Student Account
              </Button>
              <Button size="lg" variant="outline" className="text-slate-900 bg-white border-white hover:bg-slate-100" onClick={() => navigate('/dashboard')}>
                View Demo Dashboard
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};
