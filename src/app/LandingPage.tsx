import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, ShieldCheck, Zap, Activity, Users, FileCheck2, Camera, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LandingPage() {
  return (
    <div className="flex flex-col w-full overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-16 pb-10 md:pt-20 md:pb-14 lg:pt-24 lg:pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full min-h-[calc(100vh-96px)] flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 flex flex-col"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-civic-soft-yellow border border-civic-yellow/20 text-civic-deep text-[12px] font-bold uppercase tracking-wider mb-6 w-fit">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-civic-red opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-civic-red"></span>
              </span>
              Hyperlocal Solver v1.0
            </div>
            <h1 className="text-[44px] md:text-[60px] lg:text-[72px] leading-[0.95] font-semibold tracking-tighter mb-5">
              Turn local issues into<br className="hidden md:block"/>
              <span className="font-accent italic text-civic-deep font-normal">
                {' '}verified civic action.
              </span>
            </h1>
            <p className="text-[16px] md:text-[18px] text-civic-muted leading-relaxed max-w-[540px] mb-8 text-balance">
              CivicLens uses Civic Intelligence to verify civic evidence, merge duplicate reports, prioritize urgent problems, and confirm real-world resolution.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/report"
                className="px-6 py-3.5 bg-civic-primary text-white font-bold rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-civic-deep transition-all flex items-center justify-center gap-3"
              >
                Report an Issue
                <ArrowRight size={18} strokeWidth={2.5} />
              </Link>
              <Link
                to="/map"
                className="px-6 py-3.5 bg-white border border-civic-border text-civic-main font-bold rounded-2xl hover:bg-civic-soft-bg transition-all flex items-center justify-center"
              >
                View Civic Map
              </Link>
            </div>
          </motion.div>

          {/* Floating AI Panel Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative lg:col-span-5 w-full max-w-lg lg:ml-auto"
          >
            <div className="bg-white rounded-3xl shadow-[0_16px_32px_-8px_rgba(0,0,0,0.06)] border border-civic-border p-6 relative z-10 hover:-translate-y-1 transition-transform duration-300">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-civic-soft-red flex items-center justify-center text-civic-red">
                    <Zap size={20} strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Main Street Pothole</h3>
                    <p className="text-[11px] text-civic-muted">Report #8492 • 12 mins ago</p>
                  </div>
                </div>
                <div className="px-2.5 py-1 bg-civic-success/10 text-civic-success text-[10px] font-bold rounded-full border border-civic-success/20">
                  VERIFIED
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-civic-soft-bg rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[11px] font-bold text-civic-muted uppercase tracking-wider">Evidence Score</span>
                    <span className="text-[11px] font-bold text-civic-primary">94% Confidence</span>
                  </div>
                  <div className="w-full h-1.5 bg-civic-border rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '94%' }}
                      transition={{ duration: 1.5, delay: 0.8, ease: "easeOut" }}
                      className="h-full bg-civic-primary"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-1 p-3 border border-civic-border rounded-xl">
                    <div className="text-[10px] text-civic-muted mb-1">Priority</div>
                    <div className="text-sm font-bold text-civic-red">Critical</div>
                  </div>
                  <div className="flex-1 p-3 border border-civic-border rounded-xl">
                    <div className="text-[10px] text-civic-muted mb-1">Duplicates</div>
                    <div className="text-sm font-bold text-civic-main">4 Merged</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-civic-border flex items-center gap-3">
                  <div className="w-8 h-8 shrink-0 rounded-lg bg-civic-yellow/20 flex items-center justify-center text-amber-600">
                    <Zap size={16} strokeWidth={2.5} />
                  </div>
                  <p className="text-[11px] leading-tight text-civic-main">
                    <span className="font-bold">Civic Intelligence:</span> Structural failure confirmed. Hazard level high due to proximity to school crossing.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Decorative Badge behind panel */}
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-civic-yellow rounded-full flex items-center justify-center rotate-12 z-0 opacity-20"></div>
          </motion.div>
        </div>
      </section>

      {/* Civic Pulse Strip */}
      <section className="border-y border-civic-border bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex flex-wrap justify-center md:justify-start gap-12 md:gap-16">
            {[
              { label: 'Verified Reports', value: '1,240', color: 'text-civic-main' },
              { label: 'Critical Issues', value: '82', color: 'text-civic-red' },
              { label: 'Resolved Cases', value: '450', color: 'text-civic-success' },
              { label: 'Community Votes', value: '18k+', color: 'text-civic-primary' },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col">
                <div className={cn("text-[28px] font-bold tracking-tighter", stat.color)}>
                  {stat.value}
                </div>
                <div className="text-[11px] font-bold text-civic-muted uppercase tracking-widest">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-6">
            <div className="h-12 w-[1px] bg-civic-border"></div>
            <div className="text-right">
              <p className="text-[13px] font-medium text-civic-main">The transparency platform</p>
              <p className="text-[11px] text-civic-muted">Powered by Civic Intelligence</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full relative">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-heading font-semibold mb-6">
            A smarter way to fix the city.
          </h2>
          <p className="text-lg text-civic-muted">
            From smartphone camera to municipal resolution, every step is analyzed, verified, and transparent.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: '01',
              title: 'Report with proof',
              desc: 'Snap a photo and report locally. No complicated forms or vague descriptions needed.'
            },
            {
              step: '02',
              title: 'AI verifies evidence',
              desc: 'Civic Intelligence analyzes the image for validity, extracts context, and clusters it with similar reports.'
            },
            {
              step: '03',
              title: 'Community confirms',
              desc: 'Locals upvote and validate the issue, dynamically increasing its priority score.'
            },
            {
              step: '04',
              title: 'Admin prioritizes',
              desc: 'City admins receive an AI-generated escalation packet with everything needed to dispatch a crew.'
            },
            {
              step: '05',
              title: 'Resolution is verified',
              desc: 'A before/after photo confirms the work is actually done, closing the loop publicly.'
            }
          ].map((item, i, arr) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={cn(
                "p-6 rounded-3xl bg-white border border-civic-border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden",
                i === 3 ? "md:col-span-1 md:col-start-1 md:translate-x-1/2" : "",
                i === 4 ? "md:col-span-1 md:col-start-2 md:translate-x-1/2" : ""
              )}
            >
              <div className="font-mono text-civic-primary/10 text-5xl font-bold absolute -top-1 -right-1 tracking-tighter">
                {item.step}
              </div>
              <h3 className="font-heading text-lg font-semibold text-civic-main mb-2 relative z-10">{item.title}</h3>
              <p className="text-sm text-civic-muted leading-relaxed relative z-10">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Intelligence Layer */}
      <section className="py-20 bg-civic-soft-bg text-civic-main px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute top-0 -left-1/4 w-1/2 h-full bg-gradient-to-r from-civic-primary to-transparent blur-3xl" />
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-5xl font-heading font-semibold mb-6">
                The <span className="font-accent italic text-civic-primary font-normal">intelligence</span> layer.
              </h2>
              <p className="text-lg text-civic-muted mb-10 text-balance">
                CivicLens doesn't just log complaints; it understands them. Using advanced multimodal AI, it turns raw citizen input into structured, actionable intelligence for city officials.
              </p>
              
              <div className="space-y-6">
                {[
                  { title: 'Duplicate Clustering', desc: 'Automatically merges multiple reports of the same issue into one high-priority ticket.' },
                  { title: 'Priority Engine', desc: 'Ranks issues based on severity, proximity to schools, and community validation volume.' },
                  { title: 'Escalation Packets', desc: 'Generates one-click PDF summaries with location data, threat level, and exact repair requirements.' }
                ].map((feature, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-civic-primary/10 flex items-center justify-center text-civic-primary border border-civic-primary/20">
                      <CheckCircle2 size={14} />
                    </div>
                    <div>
                      <h4 className="font-heading font-semibold text-lg">{feature.title}</h4>
                      <p className="text-civic-muted mt-1">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Admin Dashboard Preview */}
            <div className="bg-white border border-civic-border rounded-3xl p-2 shadow-2xl">
              <div className="bg-civic-soft-bg rounded-2xl overflow-hidden border border-civic-border">
                <div className="border-b border-civic-border p-4 flex items-center justify-between bg-white/50">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-yellow-400" />
                      <div className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                    <span className="text-xs font-mono text-civic-muted ml-2">admin.civiclens.gov</span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-end mb-6">
                    <div>
                      <h5 className="font-heading font-semibold text-civic-main">Command Center</h5>
                      <p className="text-xs text-civic-muted mt-1">Real-time issue prioritization</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-mono text-civic-red font-bold">4</div>
                      <div className="text-xs text-civic-muted">Critical escalations</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-white border border-civic-border rounded-xl p-4 flex justify-between items-center shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-2 h-10 rounded-full",
                            i === 1 ? "bg-red-500" : i === 2 ? "bg-yellow-500" : "bg-blue-500"
                          )} />
                          <div>
                            <div className="text-sm font-semibold text-civic-main">
                              {i === 1 ? 'Water Main Break' : i === 2 ? 'Downed Tree' : 'Fallen Sign'}
                            </div>
                            <div className="text-xs text-civic-muted flex items-center gap-1 mt-1">
                              <MapPin size={10} /> {i === 1 ? 'Oak St.' : i === 2 ? 'Park Ave.' : 'Elm Rd.'}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-xs font-mono px-2 py-1 bg-civic-soft-bg border border-civic-border rounded-md text-civic-main">Score: {98 - (i * 5)}</span>
                          <span className="text-[10px] text-civic-muted">{i * 3} clustered reports</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 text-center max-w-4xl mx-auto w-full">
        <h2 className="text-4xl md:text-5xl font-heading font-semibold mb-6 text-civic-main">
          Ready to improve your community?
        </h2>
        <p className="text-lg text-civic-muted mb-10 max-w-2xl mx-auto">
          Join thousands of citizens taking action and fixing local issues with the power of AI-verified reporting.
        </p>
        <Link
          to="/report"
          className="inline-flex items-center justify-center gap-2 bg-civic-main text-white px-8 py-4 rounded-full font-medium hover:bg-civic-deep transition-all shadow-md"
        >
          Report an Issue Now
          <ArrowRight size={18} />
        </Link>
      </section>
    </div>
  );
}
