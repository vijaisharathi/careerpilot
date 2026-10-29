import React from 'react';
import { Compass, ShieldCheck, Cpu, Database } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <Compass className="w-4 h-4" />
              </div>
              <span className="font-bold text-slate-900 tracking-tight text-base">Career Pilot AI</span>
            </div>
            <p className="mt-3 text-sm text-slate-500 max-w-md leading-relaxed">
              AI-Powered Career Guidance & Placement Agent designed for college students to analyze skills,
              discover career paths, build customized learning roadmaps, and excel in campus placements.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 font-mono">
                <Cpu className="w-3 h-3 text-indigo-600" /> Node.js + Express
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 font-mono">
                <Database className="w-3 h-3 text-emerald-600" /> MongoDB + Mongoose
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 font-mono">
                <ShieldCheck className="w-3 h-3 text-amber-600" /> JWT Auth & Zod
              </span>
            </div>
          </div>

          <div>
            <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Core Architecture</h5>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>Provider-Independent LLM Service</li>
              <li>Centralized Error Handling</li>
              <li>Standardized JSON Envelope</li>
              <li>Strict Zod Request Validation</li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Future Modules</h5>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>Skill Gap & Roadmaps</li>
              <li>Resume Parser & Builder</li>
              <li>Mock Interview Simulation</li>
              <li>Job & Internship Tracker</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <div>
            &copy; {new Date().getFullYear()} Career Pilot AI. Production-ready full-stack architecture.
          </div>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-600 cursor-pointer">Security Policy</span>
            <span className="hover:text-slate-600 cursor-pointer">API Documentation</span>
            <span className="hover:text-slate-600 cursor-pointer">Health Checks</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
