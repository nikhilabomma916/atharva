import Link from 'next/link';
import {
  Shield, Zap, Search, Eye, Brain, BarChart3,
  ArrowRight, CheckCircle2, FileText, Users, Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const steps = [
  { icon: FileText, title: 'Submit', desc: 'File your grievance with details and evidence' },
  { icon: Brain, title: 'AI Understands', desc: 'AI analyzes, classifies, and prioritizes your complaint' },
  { icon: Zap, title: 'Smart Routing', desc: 'Automatically routed to the right department' },
  { icon: Users, title: 'Officer Resolves', desc: 'Assigned officer works on resolution with AI assistance' },
  { icon: Eye, title: 'Citizen Tracks', desc: 'Real-time status updates and transparent tracking' },
];

const features = [
  { icon: Zap, title: 'Faster Prioritization', desc: 'AI instantly scores and prioritizes based on severity, impact, and urgency' },
  { icon: Building2, title: 'Intelligent Routing', desc: 'Complaints automatically routed to the correct department and officer' },
  { icon: Search, title: 'Duplicate Detection', desc: 'AI identifies similar complaints to prevent redundant work' },
  { icon: Eye, title: 'Transparent Tracking', desc: 'Track your grievance status in real-time with full timeline visibility' },
  { icon: Brain, title: 'AI-Assisted Resolution', desc: 'Officers get AI-powered recommendations for faster resolution' },
  { icon: BarChart3, title: 'Systemic Issue Detection', desc: 'Identifies recurring problems for proactive government action' },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary">
              <Shield className="size-5 text-primary-foreground" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-foreground">CivicResolve</span>
              <span className="ml-1 text-lg font-bold text-primary">AI</span>
            </div>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="#how-it-works" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">How It Works</Link>
            <Link href="#features" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Features</Link>
            <Link href="/login" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Sign In</Link>
            <Link href="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </nav>
          <Link href="/login" className="md:hidden">
            <Button size="sm" variant="outline">Sign In</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/3" />
        <div className="absolute -top-24 -right-24 size-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 size-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-white/80 px-4 py-1.5 text-sm font-medium text-muted-foreground shadow-sm backdrop-blur-sm">
              <Brain className="size-4 text-primary" />
              AI-Powered Grievance Intelligence
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Report. Track.{' '}
              <span className="text-primary">Resolve.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              An AI-assisted platform for faster, smarter and more transparent citizen grievance resolution.
              Turning citizen grievances into actionable government intelligence.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/register">
                <Button size="lg" className="h-12 gap-2 px-8 text-base font-semibold shadow-lg shadow-primary/20">
                  <FileText className="size-5" />
                  Submit Grievance
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="h-12 gap-2 px-8 text-base font-semibold">
                  <Search className="size-5" />
                  Track Grievance
                </Button>
              </Link>
            </div>
            <div className="mt-12 flex items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-emerald-500" />
                <span>Free & Open Source</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-emerald-500" />
                <span>AI-Powered Analysis</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-emerald-500" />
                <span>Transparent Tracking</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="border-t bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How It Works</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              From complaint to resolution in five intelligent steps
            </p>
          </div>
          <div className="relative mt-16">
            {/* Connection line */}
            <div className="absolute top-12 right-0 left-0 hidden h-0.5 bg-gradient-to-r from-transparent via-primary/20 to-transparent lg:block" />
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5">
              {steps.map((step, i) => (
                <div key={step.title} className="group relative flex flex-col items-center text-center">
                  <div className="relative z-10 mb-4 flex size-20 items-center justify-center rounded-2xl border bg-white shadow-sm transition-all group-hover:shadow-md group-hover:shadow-primary/10">
                    <step.icon className="size-8 text-primary" />
                    <span className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{i + 1}</span>
                  </div>
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{step.desc}</p>
                  {i < steps.length - 1 && (
                    <ArrowRight className="mt-4 size-5 text-muted-foreground/40 lg:hidden" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Why CivicResolve AI?</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Transforming individual complaints into systemic government intelligence
            </p>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="group rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:shadow-primary/5">
                <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <f.icon className="size-6" />
                </div>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Responsible AI */}
      <section className="border-t bg-primary/5 py-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <Shield className="mx-auto mb-4 size-10 text-primary" />
          <h2 className="text-2xl font-bold">Responsible AI</h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            AI assists authorized officers. Final decisions remain with authorized human officials.
            Prioritization is based solely on severity, impact, safety, urgency, duration, and recurrence — never on personal identity.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t py-20 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ready to Report?</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Submit your grievance today and experience transparent, AI-assisted resolution.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/register">
              <Button size="lg" className="h-12 gap-2 px-8 text-base font-semibold">
                Create Account
                <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="h-12 px-8 text-base font-semibold">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <Shield className="size-5 text-primary" />
              <span className="font-semibold">CivicResolve AI</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Turning citizen grievances into actionable government intelligence.
            </p>
            <p className="text-xs text-muted-foreground">
              Zero-cost • Open Source • Local AI
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
