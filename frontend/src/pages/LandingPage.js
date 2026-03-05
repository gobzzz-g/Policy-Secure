/**
 * Landing Page - Premium Redesign
 * Modern AI SaaS platform landing page for PolicySecure
 */

import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  CheckCircle,
  TrendingUp,
  Users,
  ArrowRight,
  Brain,
  FileCheck,
  Clock,
  ChevronRight,
  Star,
  Zap,
  BarChart3,
  Search,
  FileText,
  AlertTriangle,
  DollarSign,
  Play,
  Menu,
  X,
  ExternalLink,
  Github,
  Twitter,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Globe,
  Award,
  Lock,
  Sparkles,
} from 'lucide-react';

/* ========== Animated Counter Hook ========== */
const useCountUp = (end, duration = 2000, startOnView = true) => {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!startOnView) {
      setHasStarted(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [hasStarted, startOnView]);

  useEffect(() => {
    if (!hasStarted) return;
    let startTime;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [hasStarted, end, duration]);

  return { count, ref };
};

/* ========== Intersection Observer Hook ========== */
const useInView = (options = {}) => {
  const ref = useRef(null);
  const [isInView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, ...options }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, isInView };
};

/* ========== Navbar Component ========== */
const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'Solutions', href: '#process' },
    { label: 'Pricing', href: '#stats' },
    { label: 'About', href: '#testimonials' },
  ];

  return (
    <nav
      id="navbar"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled || mobileOpen
        ? 'bg-surface-950/95 backdrop-blur-xl border-b border-white/5 shadow-lg shadow-black/10'
        : 'bg-transparent'
        }`}
      style={mobileOpen && !scrolled ? { backgroundColor: '#0f172a' } : {}}
    >
      <div className="section-container">
        <div className="flex justify-between items-center h-18 py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-violet rounded-xl flex items-center justify-center shadow-glow group-hover:shadow-glow-lg transition-shadow duration-300">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight" style={{ textShadow: '0 2px 10px rgba(99, 102, 241, 0.5)' }}>
              Policy<span className="text-primary-400" style={{ textShadow: '0 2px 15px rgba(99, 102, 241, 0.8)' }}>Secure</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="px-4 py-2 text-sm font-medium text-surface-300 hover:text-white rounded-lg hover:bg-white/5 transition-all duration-200"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center space-x-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium text-surface-300 hover:text-white transition-colors"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white text-sm font-semibold rounded-xl hover:shadow-glow transition-all duration-300 hover:-translate-y-0.5"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden text-white p-2"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div 
            className="md:hidden pb-6 animate-fade-in-down rounded-b-2xl" 
            style={{ backgroundColor: '#0f172a', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)' }}
          >
            <div className="flex flex-col space-y-1 mb-4 pt-4">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-3 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-all mx-2"
                >
                  {link.label}
                </a>
              ))}
            </div>
            <div className="flex flex-col space-y-2 pt-4 border-t border-gray-700 mx-2">
              <Link to="/login" className="btn btn-ghost text-center">Login</Link>
              <Link to="/register" className="btn btn-glow text-center">Get Started</Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

/* ========== Hero Section ========== */
const HeroSection = () => {
  const { ref, isInView } = useInView();

  const featureHighlights = [
    'AI-Powered Claims Analysis',
    'Real-time Fraud Detection',
    'Multi-Insurance Coverage',
    'Instant Settlement Calc',
  ];
  const [activeHighlight, setActiveHighlight] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveHighlight((prev) => (prev + 1) % featureHighlights.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      id="hero"
      ref={ref}
      className="relative min-h-screen flex items-center overflow-hidden"
    >
      {/* Background effects */}
      <div className="absolute inset-0 bg-surface-950 grid-bg" />
      <div className="glow-orb w-[300px] h-[300px] sm:w-[600px] sm:h-[600px] bg-primary-600 top-[-150px] right-[-150px] sm:top-[-200px] sm:right-[-100px]" />
      <div className="glow-orb w-[250px] h-[250px] sm:w-[500px] sm:h-[500px] bg-accent-violet top-[30%] left-[-150px] sm:left-[-200px]" />
      <div className="glow-orb w-[200px] h-[200px] sm:w-[300px] sm:h-[300px] bg-accent-cyan bottom-[-100px] right-[10%] sm:right-[20%]" />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-primary-400/30 rounded-full animate-float"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.8}s`,
              animationDuration: `${5 + i}s`,
            }}
          />
        ))}
      </div>

      <div className="section-container relative z-10 pt-24 sm:pt-32 pb-16 sm:pb-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div
            className={`inline-flex items-center px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 mb-8
              ${isInView ? 'animate-fade-in-down' : 'opacity-0'}`}
          >
            <Sparkles className="w-4 h-4 text-primary-400 mr-2" />
            <span className="text-sm font-medium text-primary-300">
              Powered by Google Gemini AI
            </span>
          </div>

          {/* Headline */}
          <h1
            className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-[1.15] mb-6 px-2
              ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}
          >
            <span className="text-white">Intelligent Insurance</span>
            <br />
            <span className="gradient-text">Claims Processing</span>
          </h1>

          {/* Subtitle */}
          <p
            className={`text-base sm:text-lg md:text-xl text-surface-400 mb-8 max-w-2xl mx-auto leading-relaxed px-4
              ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}
            style={{ animationDelay: '0.2s' }}
          >
            Streamline your entire claims lifecycle with AI-driven fraud detection,
            and intelligent settlement recommendations all in one platform.
          </p>

          {/* Rotating feature highlight */}
          <div
            className={`flex items-center justify-center space-x-2 mb-10
              ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}
            style={{ animationDelay: '0.3s' }}
          >
            <Zap className="w-4 h-4 text-accent-amber" />
            <span className="text-accent-amber font-medium text-sm tracking-wide" key={activeHighlight}>
              {featureHighlights[activeHighlight]}
            </span>
          </div>

          {/* CTA Buttons */}
          <div
            className={`flex flex-col sm:flex-row gap-4 justify-center items-center
              ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}
            style={{ animationDelay: '0.4s' }}
          >
            <Link
              to="/register"
              className="group btn-glow px-8 py-4 text-base rounded-2xl inline-flex items-center"
            >
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#process"
              className="group px-8 py-4 text-base font-medium text-surface-300 hover:text-white bg-white/5 border border-white/10 rounded-2xl hover:border-white/20 transition-all duration-300 inline-flex items-center"
            >
              <Play className="w-4 h-4 mr-2" />
              View Demo
            </a>
          </div>

          {/* Trust indicators */}
          <div
            className={`flex items-center justify-center space-x-6 mt-12 text-surface-500 text-sm
              ${isInView ? 'animate-fade-in' : 'opacity-0'}`}
            style={{ animationDelay: '0.6s' }}
          >
            <div className="flex items-center space-x-1">
              <Lock className="w-3.5 h-3.5" />
              <span>SOC 2 Compliant</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-surface-600" />
            <div className="flex items-center space-x-1">
              <Shield className="w-3.5 h-3.5" />
              <span>256-bit Encryption</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-surface-600" />
            <div className="flex items-center space-x-1">
              <Award className="w-3.5 h-3.5" />
              <span>IRDAI Approved</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-surface-950 to-transparent" />
    </section>
  );
};

/* ========== Stat Card Item ========== */
const StatCardItem = ({ stat }) => {
  const Icon = stat.icon;
  const { count, ref } = useCountUp(stat.value, 2000);

  return (
    <div
      ref={ref}
      className="group relative card card-hover text-center overflow-hidden"
    >
      {/* Glow effect */}
      <div
        className={`absolute -top-12 left-1/2 -translate-x-1/2 w-32 h-32 ${stat.glowColor} rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500`}
      />

      <div className="relative z-10">
        <div
          className={`w-14 h-14 mx-auto mb-4 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center shadow-lg`}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="text-4xl font-extrabold text-white mb-1">
          {count}
          <span className="text-2xl">{stat.suffix}</span>
        </div>
        <div className="text-sm font-semibold text-surface-300">{stat.label}</div>
        <div className="text-xs text-surface-500 mt-0.5">{stat.sublabel}</div>
      </div>
    </div>
  );
};

/* ========== Statistics Section ========== */
const StatsSection = () => {
  const stats = [
    {
      value: 6,
      suffix: '+',
      label: 'Insurance Types',
      sublabel: 'Supported',
      icon: FileCheck,
      color: 'from-primary-500 to-primary-600',
      glowColor: 'bg-primary-500',
    },
    {
      value: 99,
      suffix: '%',
      label: 'AI Processing',
      sublabel: 'Accuracy',
      icon: Brain,
      color: 'from-accent-violet to-purple-600',
      glowColor: 'bg-accent-violet',
    },
    {
      value: 50,
      suffix: 'K+',
      label: 'Claims Processed',
      sublabel: 'Monthly',
      icon: TrendingUp,
      color: 'from-accent-cyan to-teal-600',
      glowColor: 'bg-accent-cyan',
    },
    {
      value: 97,
      suffix: '%',
      label: 'Fraud Detection',
      sublabel: 'Accuracy Rate',
      icon: AlertTriangle,
      color: 'from-accent-rose to-pink-600',
      glowColor: 'bg-accent-rose',
    },
  ];

  return (
    <section id="stats" className="relative section-padding">
      <div className="section-container">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <StatCardItem key={idx} stat={stat} />
          ))}
        </div>
      </div>
    </section>
  );
};

/* ========== Features Section ========== */
const FeaturesSection = () => {
  const { ref, isInView } = useInView();

  const features = [
    {
      icon: Brain,
      title: 'AI Claim Analysis',
      description: 'Google Gemini AI evaluates claims for fraud risk, validates documents, and provides intelligent settlement recommendations.',
      gradient: 'from-primary-500 to-primary-600',
      tag: 'Core AI',
    },
    {
      icon: FileCheck,
      title: 'Multi-Insurance Support',
      description: 'Handle Health, Motor, Property, Travel, Crop, and Personal Accident claims with type-specific processing.',
      gradient: 'from-accent-cyan to-teal-600',
      tag: '6 Types',
    },
    {
      icon: AlertTriangle,
      title: 'Fraud Detection',
      description: 'Hybrid rule-based + AI system identifies suspicious patterns with 97% accuracy rate.',
      gradient: 'from-accent-rose to-pink-600',
      tag: 'Security',
    },
    {
      icon: Users,
      title: 'Role-Based Access',
      description: 'Dedicated interfaces for policyholders, claims officers, fraud investigators, and administrators.',
      gradient: 'from-accent-violet to-purple-600',
      tag: '5 Roles',
    },
    {
      icon: Clock,
      title: 'Fast Processing',
      description: 'Automated workflows reduce claim processing time by 80%. From submission to settlement in minutes.',
      gradient: 'from-accent-amber to-orange-600',
      tag: 'Speed',
    },
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description: 'Comprehensive insights into claims volume, fraud trends, settlement patterns, and performance metrics.',
      gradient: 'from-emerald-500 to-green-600',
      tag: 'Insights',
    },
  ];

  return (
    <section id="features" className="relative section-padding" ref={ref}>
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-surface-950 via-surface-900/50 to-surface-950" />

      <div className="section-container relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div
            className={`inline-flex items-center px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 mb-6
              ${isInView ? 'animate-fade-in' : 'opacity-0'}`}
          >
            <span className="text-xs font-semibold text-primary-400 uppercase tracking-wider">Features</span>
          </div>
          <h2
            className={`section-title ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}
          >
            Comprehensive Claims{' '}
            <span className="gradient-text">Management</span>
          </h2>
          <p
            className={`section-subtitle mt-4 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}
            style={{ animationDelay: '0.15s' }}
          >
            Everything you need to process insurance claims efficiently,
            securely, and intelligently.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className={`group card card-hover relative overflow-hidden
                  ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}
                style={{ animationDelay: `${0.1 * idx}s` }}
              >
                {/* Hover glow */}
                <div className={`absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br ${feature.gradient} rounded-full blur-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

                <div className="relative z-10">
                  {/* Tag */}
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-surface-500 bg-surface-800 px-2.5 py-1 rounded-full">
                      {feature.tag}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-primary-300 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-surface-400 leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Learn more link */}
                  <div className="mt-4 flex items-center text-primary-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                    Learn more
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

/* ========== Process Workflow Section ========== */
const ProcessSection = () => {
  const { ref, isInView } = useInView();

  const steps = [
    {
      icon: FileText,
      title: 'Submit Claim',
      description: 'Policyholder submits claim with supporting documents through the intuitive portal.',
      color: 'from-primary-500 to-primary-600',
    },
    {
      icon: Search,
      title: 'AI Document Analysis',
      description: 'Gemini AI analyzes all submitted documents for completeness and validity.',
      color: 'from-accent-violet to-purple-600',
    },
    {
      icon: AlertTriangle,
      title: 'Fraud Detection',
      description: 'Hybrid detection system scans for suspicious patterns and anomalies.',
      color: 'from-accent-rose to-pink-600',
    },
    {
      icon: CheckCircle,
      title: 'Claim Assessment',
      description: 'AI generates comprehensive assessment with risk scoring and recommendations.',
      color: 'from-accent-cyan to-teal-600',
    },
    {
      icon: DollarSign,
      title: 'Settlement Recommendation',
      description: 'Automated settlement calculation with AI-driven amount suggestions.',
      color: 'from-accent-emerald to-green-600',
    },
  ];

  return (
    <section id="process" className="relative section-padding overflow-hidden">
      <div className="absolute inset-0 bg-surface-950" />
      <div className="glow-orb w-[400px] h-[400px] bg-primary-600 top-[20%] right-[-100px]" />
      <div className="glow-orb w-[300px] h-[300px] bg-accent-violet bottom-[10%] left-[-100px]" />

      <div className="section-container relative z-10" ref={ref}>
        {/* Header */}
        <div className="text-center mb-16">
          <div
            className={`inline-flex items-center px-3 py-1 rounded-full bg-accent-cyan/10 border border-accent-cyan/20 mb-6
              ${isInView ? 'animate-fade-in' : 'opacity-0'}`}
          >
            <span className="text-xs font-semibold text-accent-cyan uppercase tracking-wider">How it works</span>
          </div>
          <h2
            className={`section-title ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}
          >
            Seamless 5-Step{' '}
            <span className="gradient-text">Workflow</span>
          </h2>
          <p
            className={`section-subtitle mt-4 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}
            style={{ animationDelay: '0.15s' }}
          >
            From claim submission to settlement — automated, intelligent, and transparent.
          </p>
        </div>

        {/* Steps */}
        <div className="relative max-w-4xl mx-auto">
          {/* Connector line */}
          <div className="hidden md:block absolute left-[39px] top-[60px] bottom-[60px] w-px bg-gradient-to-b from-primary-500/50 via-accent-violet/50 to-accent-emerald/50" />

          <div className="space-y-6">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div
                  key={idx}
                  className={`group flex items-start gap-6 relative
                    ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}
                  style={{ animationDelay: `${0.15 * idx}s` }}
                >
                  {/* Step number + icon */}
                  <div className="flex-shrink-0 relative">
                    <div className={`w-20 h-20 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-glow transition-shadow duration-300`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-7 h-7 bg-surface-800 border-2 border-surface-600 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-white">{idx + 1}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="card card-hover flex-1 group-hover:border-primary-500/20">
                    <h3 className="text-lg font-bold text-white mb-1.5">{step.title}</h3>
                    <p className="text-sm text-surface-400 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

/* ========== Dashboard Preview Section ========== */
const DashboardPreview = () => {
  const { ref, isInView } = useInView();

  return (
    <section id="dashboard-preview" className="relative section-padding overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-surface-950 via-surface-900/30 to-surface-950" />

      <div className="section-container relative z-10" ref={ref}>
        {/* Header */}
        <div className="text-center mb-16">
          <div
            className={`inline-flex items-center px-3 py-1 rounded-full bg-accent-violet/10 border border-accent-violet/20 mb-6
              ${isInView ? 'animate-fade-in' : 'opacity-0'}`}
          >
            <span className="text-xs font-semibold text-accent-violet uppercase tracking-wider">Product Preview</span>
          </div>
          <h2
            className={`section-title ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}
          >
            Powerful{' '}
            <span className="gradient-text">Dashboard</span>
          </h2>
          <p
            className={`section-subtitle mt-4 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}
            style={{ animationDelay: '0.15s' }}
          >
            Get a bird's-eye view of your entire claims operation with real-time analytics and AI insights.
          </p>
        </div>

        {/* Dashboard Image */}
        <div
          className={`relative max-w-5xl mx-auto ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}
          style={{ animationDelay: '0.3s' }}
        >
          {/* Glow behind */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary-600/20 via-accent-violet/20 to-accent-cyan/20 blur-3xl rounded-3xl scale-105" />

          {/* Browser mockup */}
          <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
            {/* Browser bar */}
            <div className="bg-surface-800/90 backdrop-blur-md px-4 py-3 flex items-center space-x-3 border-b border-white/5">
              <div className="flex space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="flex-1 mx-4">
                <div className="bg-surface-700/50 rounded-lg px-4 py-1.5 text-xs text-surface-400 flex items-center">
                  <Lock className="w-3 h-3 mr-2 text-green-400" />
                  app.policysecure.ai/dashboard
                </div>
              </div>
            </div>

            {/* Dashboard Image */}
            <img
              src="/dashboard-preview.png"
              alt="PolicySecure Dashboard Preview"
              className="w-full"
              loading="lazy"
            />
          </div>

          {/* Floating badges */}
          <div className="absolute -right-4 top-1/4 card-glass px-4 py-3 animate-float hidden lg:flex items-center space-x-2 shadow-xl">
            <div className="w-8 h-8 bg-accent-emerald/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-accent-emerald" />
            </div>
            <div>
              <div className="text-xs text-surface-400">Processing Speed</div>
              <div className="text-sm font-bold text-accent-emerald">+340% faster</div>
            </div>
          </div>

          <div className="absolute -left-4 bottom-1/4 card-glass px-4 py-3 animate-float-slow hidden lg:flex items-center space-x-2 shadow-xl" style={{ animationDelay: '2s' }}>
            <div className="w-8 h-8 bg-accent-violet/20 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-accent-violet" />
            </div>
            <div>
              <div className="text-xs text-surface-400">Fraud Caught</div>
              <div className="text-sm font-bold text-accent-violet">$2.4M saved</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ========== Testimonials Section ========== */
const TestimonialsSection = () => {
  const { ref, isInView } = useInView();

  const testimonials = [
    {
      quote: "PolicySecure's AI has transformed our claims processing. What used to take days now takes minutes with incredible accuracy.",
      author: 'Rajesh Kumar',
      role: 'Claims Manager',
      company: 'United Insurance Co.',
      avatar: 'RK',
      rating: 5,
    },
    {
      quote: "The fraud detection system caught anomalies we would have never spotted. It's already saved us millions in fraudulent claims.",
      author: 'Priya Sharma',
      role: 'Fraud Investigator',
      company: 'National Insurance',
      avatar: 'PS',
      rating: 5,
    },
    {
      quote: "As a policyholder, the transparency and speed of claim settlements has been remarkable. I received my settlement in 48 hours!",
      author: 'Arun Mehta',
      role: 'Policyholder',
      company: 'Individual Customer',
      avatar: 'AM',
      rating: 5,
    },
  ];

  const partners = [
    'United Insurance', 'National Life', 'SecureHealth', 'AutoGuard', 'PropertyShield', 'TravelSafe'
  ];

  return (
    <section id="testimonials" className="relative section-padding">
      <div className="absolute inset-0 bg-surface-950" />

      <div className="section-container relative z-10" ref={ref}>
        {/* Header */}
        <div className="text-center mb-16">
          <div
            className={`inline-flex items-center px-3 py-1 rounded-full bg-accent-amber/10 border border-accent-amber/20 mb-6
              ${isInView ? 'animate-fade-in' : 'opacity-0'}`}
          >
            <span className="text-xs font-semibold text-accent-amber uppercase tracking-wider">Testimonials</span>
          </div>
          <h2
            className={`section-title ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}
          >
            Trusted by{' '}
            <span className="gradient-text">Industry Leaders</span>
          </h2>
          <p
            className={`section-subtitle mt-4 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}
            style={{ animationDelay: '0.15s' }}
          >
            See why insurance professionals trust PolicySecure for their claims management.
          </p>
        </div>

        {/* Testimonial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className={`card card-hover relative overflow-hidden
                ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}
              style={{ animationDelay: `${0.15 * idx}s` }}
            >
              {/* Stars */}
              <div className="flex space-x-1 mb-4">
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-accent-amber fill-accent-amber" />
                ))}
              </div>

              <p className="text-surface-300 text-sm leading-relaxed mb-6 italic">
                "{t.quote}"
              </p>

              <div className="flex items-center space-x-3 pt-4 border-t border-white/5">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-violet flex items-center justify-center text-white text-sm font-bold">
                  {t.avatar}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{t.author}</div>
                  <div className="text-xs text-surface-500">{t.role} · {t.company}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Partners / Trust badges */}
        <div
          className={`${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}
          style={{ animationDelay: '0.5s' }}
        >
          <p className="text-center text-surface-500 text-sm font-medium uppercase tracking-wider mb-8">
            Trusted by leading insurance partners
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {partners.map((partner, idx) => (
              <div
                key={idx}
                className="text-surface-600 hover:text-surface-300 transition-colors text-lg font-semibold tracking-wide cursor-default"
              >
                {partner}
              </div>
            ))}
          </div>

          {/* Trust badges row */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-12">
            {[
              { icon: Shield, label: 'ISO 27001 Certified' },
              { icon: Lock, label: 'GDPR Compliant' },
              { icon: Award, label: 'IRDAI Recognized' },
              { icon: CheckCircle, label: '99.9% Uptime SLA' },
            ].map((badge, idx) => {
              const Icon = badge.icon;
              return (
                <div
                  key={idx}
                  className="flex items-center space-x-2 text-surface-500 text-sm bg-surface-800/30 px-4 py-2 rounded-full border border-surface-700/30"
                >
                  <Icon className="w-4 h-4" />
                  <span>{badge.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

/* ========== CTA Section ========== */
const CTASection = () => {
  const { ref, isInView } = useInView();

  return (
    <section className="relative section-padding" ref={ref}>
      <div className="section-container relative z-10">
        <div
          className={`relative overflow-hidden rounded-3xl ${isInView ? 'animate-scale-in' : 'opacity-0'}`}
        >
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-accent-violet" />
          <div className="absolute inset-0 bg-hero-pattern opacity-30" />
          <div className="glow-orb w-[400px] h-[400px] bg-accent-cyan top-[-100px] right-[-100px] opacity-30" />
          <div className="glow-orb w-[300px] h-[300px] bg-primary-400 bottom-[-100px] left-[-100px] opacity-30" />

          <div className="relative z-10 px-8 md:px-16 py-16 md:py-20 text-center">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
              Ready to Transform Your
              <br />
              Claims Processing?
            </h2>
            <p className="text-lg text-primary-100 mb-10 max-w-2xl mx-auto">
              Join hundreds of insurance professionals using AI-powered claims management
              to reduce fraud, speed up settlements, and delight customers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="group inline-flex items-center justify-center px-8 py-4 bg-white text-primary-700 font-bold rounded-2xl hover:bg-gray-50 transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-0.5"
              >
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-8 py-4 bg-white/10 text-white font-semibold rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300"
              >
                Schedule Demo
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ========== Footer ========== */
const Footer = () => {
  const footerLinks = {
    Product: [
      { label: 'Features', href: '#features' },
      { label: 'Pricing', href: '#stats' },
      { label: 'Dashboard', href: '#dashboard-preview' },
      { label: 'API Docs', href: '#' },
      { label: 'Integrations', href: '#' },
    ],
    Company: [
      { label: 'About Us', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Blog', href: '#' },
      { label: 'Press Kit', href: '#' },
      { label: 'Contact', href: '#' },
    ],
    Resources: [
      { label: 'Documentation', href: '#' },
      { label: 'Help Center', href: '#' },
      { label: 'Community', href: '#' },
      { label: 'Status', href: '#' },
      { label: 'Changelog', href: '#' },
    ],
    Legal: [
      { label: 'Privacy Policy', href: '#' },
      { label: 'Terms of Service', href: '#' },
      { label: 'Cookie Policy', href: '#' },
      { label: 'Security', href: '#' },
    ],
  };

  return (
    <footer className="relative bg-surface-950 border-t border-white/5">
      <div className="section-container py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-accent-violet rounded-xl flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">
                Policy<span className="gradient-text">Secure</span>
              </span>
            </div>
            <p className="text-sm text-surface-500 leading-relaxed mb-6">
              AI-powered insurance claims processing platform. Faster settlements, smarter fraud detection.
            </p>
            <div className="flex items-center space-x-3">
              {[Twitter, Linkedin, Github, Mail].map((Icon, idx) => (
                <a
                  key={idx}
                  href="#"
                  className="w-9 h-9 bg-surface-800/50 border border-surface-700/50 rounded-lg flex items-center justify-center text-surface-400 hover:text-white hover:border-primary-500/50 hover:bg-primary-500/10 transition-all duration-200"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
                {category}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-surface-500 hover:text-primary-400 transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <p className="text-sm text-surface-600">
            © 2025 PolicySecure. All rights reserved.
          </p>
          <div className="flex items-center space-x-6">
            <a href="#" className="text-sm text-surface-600 hover:text-surface-400 transition-colors">Privacy</a>
            <a href="#" className="text-sm text-surface-600 hover:text-surface-400 transition-colors">Terms</a>
            <a href="#" className="text-sm text-surface-600 hover:text-surface-400 transition-colors">Cookies</a>
            <div className="flex items-center space-x-1 text-sm text-surface-600">
              <Globe className="w-3.5 h-3.5" />
              <span>English</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

/* ========== Main Landing Page ========== */
const LandingPage = () => {
  return (
    <div className="min-h-screen bg-surface-950 relative overflow-x-hidden w-full">
      <Navbar />
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <ProcessSection />
      <DashboardPreview />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default LandingPage;
