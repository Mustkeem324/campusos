'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Gift, 
  Search, 
  CheckCircle2, 
  ExternalLink, 
  Copy, 
  ShieldCheck, 
  Sparkles, 
  Code, 
  Cpu, 
  Palette, 
  BookOpen, 
  Music, 
  Zap,
  Award,
  Layers,
  ArrowRight,
  X
} from 'lucide-react';
import { useAuthStore } from '../../lib/auth-store';

interface StudentPerk {
  id: string;
  title: string;
  provider: string;
  category: 'developer' | 'ai' | 'design' | 'learning' | 'lifestyle';
  value: string;
  badge: string;
  description: string;
  howToClaim: string[];
  claimUrl: string;
  featured?: boolean;
}

const STUDENT_PERKS: StudentPerk[] = [
  {
    id: 'github-pack',
    title: 'GitHub Student Developer Pack',
    provider: 'GitHub & Partners',
    category: 'developer',
    value: '$1,200/yr',
    badge: 'Popular',
    featured: true,
    description: 'Free GitHub Pro, GitHub Copilot, $200 DigitalOcean credits, Namecheap domain, and 80+ developer tools.',
    howToClaim: [
      'Click "Claim Benefit" to open GitHub Education.',
      'Sign in with your verified university email (@cdu.edu.in).',
      'Upload a screenshot of your CampusOS Digital Student ID Card.',
      'Approval takes 24-48 hours.'
    ],
    claimUrl: 'https://education.github.com/pack'
  },
  {
    id: 'jetbrains-pack',
    title: 'JetBrains All Products Pack',
    provider: 'JetBrains',
    category: 'developer',
    value: '$649/yr',
    badge: 'Free License',
    featured: true,
    description: 'Free subscription to all JetBrains desktop tools including IntelliJ IDEA Ultimate, PyCharm Pro, and WebStorm.',
    howToClaim: [
      'Visit JetBrains Student License page.',
      'Apply using your university email address.',
      'Confirm email verification link received in your student inbox.',
      'Download JetBrains Toolbox and activate license.'
    ],
    claimUrl: 'https://www.jetbrains.com/community/education/#students'
  },
  {
    id: 'notion-education',
    title: 'Notion Plus for Students',
    provider: 'Notion',
    category: 'ai',
    value: '$96/yr',
    badge: '100% Free',
    featured: true,
    description: 'Free Notion Plus workspace with unlimited file uploads, version history, and AI note-taking capabilities.',
    howToClaim: [
      'Sign up or log in to Notion.',
      'Go to Account Settings → Upgrade Plan.',
      'Click "Get free Education Plan" and verify with university email.'
    ],
    claimUrl: 'https://www.notion.so/product/notion-for-education'
  },
  {
    id: 'figma-education',
    title: 'Figma Professional Plan',
    provider: 'Figma',
    category: 'design',
    value: '$144/yr',
    badge: 'Design Standard',
    featured: true,
    description: 'Free Figma Professional & FigJam team workspace for UI/UX wireframing, prototyping, and team collaboration.',
    howToClaim: [
      'Create a free Figma account using your university email.',
      'Apply for Figma Education Status.',
      'Select CampusOS Demo University (CDU) as your institution.',
      'Instant access granted upon email confirmation.'
    ],
    claimUrl: 'https://www.figma.com/education/'
  },
  {
    id: 'aws-educate',
    title: 'AWS Educate & Cloud Credits',
    provider: 'Amazon Web Services',
    category: 'developer',
    value: '$250/yr',
    badge: 'Cloud Training',
    description: '$100 in AWS promotional cloud credits, free cloud learning pathways, and hands-on cloud labs.',
    howToClaim: [
      'Register on AWS Educate portal.',
      'Select "Student" and enter university email.',
      'Complete email verification to claim credits.'
    ],
    claimUrl: 'https://aws.amazon.com/education/awseducate/'
  },
  {
    id: 'copilot-student',
    title: 'GitHub Copilot Free for Students',
    provider: 'GitHub AI',
    category: 'ai',
    value: '$100/yr',
    badge: 'AI Pair Programmer',
    description: 'Free access to GitHub Copilot AI autocomplete extension for VS Code, Neovim, and JetBrains IDEs.',
    howToClaim: [
      'Ensure GitHub Student Developer Pack is activated.',
      'Install GitHub Copilot extension in VS Code.',
      'Sign in with your verified GitHub account.'
    ],
    claimUrl: 'https://github.com/features/copilot'
  },
  {
    id: 'canva-pro',
    title: 'Canva Pro for Education',
    provider: 'Canva',
    category: 'design',
    value: '$120/yr',
    badge: 'Pro Templates',
    description: 'Free Canva Pro templates, premium stock photos, font library, brand kit, and background remover.',
    howToClaim: [
      'Sign up on Canva Education portal.',
      'Verify student status with university email or student ID card.'
    ],
    claimUrl: 'https://www.canva.com/education/'
  },
  {
    id: 'coursera-campus',
    title: 'Coursera for Campus Access',
    provider: 'Coursera',
    category: 'learning',
    value: '$399/yr',
    badge: '5,000+ Courses',
    description: 'Free access to guided projects and professional certificates from Google, Meta, IBM, and top universities.',
    howToClaim: [
      'Log in to Coursera with your university email.',
      'Join CampusOS University Learning Program.'
    ],
    claimUrl: 'https://www.coursera.org/for-university'
  },
  {
    id: 'mongodb-atlas',
    title: 'MongoDB Atlas Student Credits',
    provider: 'MongoDB',
    category: 'developer',
    value: '$500/yr',
    badge: 'Database Credits',
    description: '$500 in cloud database credits and a free MongoDB Associate Developer certification exam voucher.',
    howToClaim: [
      'Claim via GitHub Student Developer Pack portal.',
      'Redeem promo code in MongoDB Atlas account settings.'
    ],
    claimUrl: 'https://www.mongodb.com/students'
  },
  {
    id: 'datacamp-edu',
    title: 'DataCamp 3-Month Access',
    provider: 'DataCamp',
    category: 'learning',
    value: '$150/yr',
    badge: 'Python & SQL',
    description: '3 months unlimited access to Data Science, Python, R, Machine Learning, and SQL learning tracks.',
    howToClaim: [
      'Ask your faculty lead or register via GitHub Student Pack.',
      'Activate your 3-month full access voucher.'
    ],
    claimUrl: 'https://www.datacamp.com/groups/education'
  },
  {
    id: 'spotify-student',
    title: 'Spotify Premium Student + Hulu',
    provider: 'Spotify',
    category: 'lifestyle',
    value: '$70/yr',
    badge: 'Discount Deal',
    description: 'Spotify Premium Student discount ($5.99/mo instead of $11.99/mo) bundled with free Hulu access.',
    howToClaim: [
      'Sign up on Spotify Student Premium page.',
      'Complete SheerID student verification using university name.'
    ],
    claimUrl: 'https://www.spotify.com/student/'
  },
  {
    id: 'prime-student',
    title: 'Amazon Prime Student',
    provider: 'Amazon',
    category: 'lifestyle',
    value: '$70/yr',
    badge: '6 Months Free',
    description: '6-month free trial of Amazon Prime delivery, Prime Video, and Prime Music, followed by 50% discount.',
    howToClaim: [
      'Sign up on Amazon Prime Student page.',
      'Provide your university email address and graduation year.'
    ],
    claimUrl: 'https://www.amazon.com/prime-student'
  }
];

export function StudentBenefitsConsole() {
  const { currentSession } = useAuthStore();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPerk, setSelectedPerk] = useState<StudentPerk | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const studentName = currentSession?.name || 'Aarav Patel';
  const studentEmail = currentSession?.email || 'student.demo@campusos.local';

  const filteredPerks = STUDENT_PERKS.filter((perk) => {
    const matchesCategory = activeCategory === 'all' || perk.category === activeCategory;
    const matchesSearch = 
      perk.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      perk.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
      perk.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCopyProof = () => {
    const proofText = `Student Verification Proof:\nName: ${studentName}\nEmail: ${studentEmail}\nInstitution: CampusOS Demo University (CDU)\nStatus: ACTIVE_STUDENT`;
    navigator.clipboard.writeText(proofText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header Banner */}
      <div className="bg-[#101B33] text-white rounded-3xl p-6 md:p-10 border border-[#2A3B5C] shadow-2xl relative overflow-hidden">
        <div className="max-w-3xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1854E8]/20 border border-[#1854E8]/40 text-[#A5D6FF] text-xs font-bold uppercase tracking-wider mb-4">
            <Gift size={14} className="text-[#1854E8]" /> CampusOS Student Perks Engine
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-3">
            Unlock over $3,500/yr in Student Benefits
          </h1>
          <p className="text-[#BEC7D7] text-base md:text-lg leading-relaxed mb-6">
            As a verified student at CampusOS Demo University, you have free access to premium developer software, cloud computing credits, AI copilots, design suites, and learning platforms.
          </p>

          {/* Student Verification Badge Bar */}
          <div className="flex flex-wrap items-center gap-4 bg-[#182642] p-4 rounded-2xl border border-[#2A3B5C]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1854E8] text-white flex items-center justify-center font-bold text-sm">
                {studentName.charAt(0)}
              </div>
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-1.5">
                  {studentName} <CheckCircle2 size={16} className="text-[#27C93F]" />
                </div>
                <div className="text-xs text-[#BEC7D7]">{studentEmail}</div>
              </div>
            </div>

            <div className="border-l border-white/10 pl-4 hidden sm:block">
              <div className="text-xs text-[#BEC7D7]">Total Available Value</div>
              <div className="text-lg font-bold text-[#27C93F]">$3,850+ / Year FREE</div>
            </div>

            <button
              onClick={handleCopyProof}
              className="ml-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
            >
              {copied ? <CheckCircle2 size={14} className="text-[#27C93F]" /> : <Copy size={14} />}
              {copied ? 'Proof Copied!' : 'Copy Verification Proof'}
            </button>
          </div>
        </div>
      </div>

      {/* Category Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {[
            { id: 'all', label: 'All Perks', icon: Layers },
            { id: 'developer', label: 'Developer & Cloud', icon: Code },
            { id: 'ai', label: 'AI & Productivity', icon: Cpu },
            { id: 'design', label: 'Design & Creative', icon: Palette },
            { id: 'learning', label: 'Learning & Certificates', icon: BookOpen },
            { id: 'lifestyle', label: 'Lifestyle & Deals', icon: Music },
          ].map((cat) => {
            const Icon = cat.icon;
            const isSelected = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all ${
                  isSelected
                    ? 'bg-[#101B33] text-white shadow-md'
                    : 'bg-white text-[#5F6B7A] hover:bg-[#F5F7FB] border border-[#DEE5EF]'
                }`}
              >
                <Icon size={16} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search size={16} className="absolute left-3.5 top-3 text-[#5F6B7A]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search perks (e.g. GitHub, AWS)..."
            className="w-full bg-white border border-[#DEE5EF] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#101B33] placeholder-[#5F6B7A] focus:outline-none focus:ring-2 focus:ring-[#1854E8]"
          />
        </div>
      </div>

      {/* Perks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPerks.map((perk) => (
          <div
            key={perk.id}
            className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between p-6 hover:shadow-lg ${
              perk.featured ? 'border-[#1854E8] ring-1 ring-[#1854E8]/20' : 'border-[#DEE5EF]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="bg-[#EEF3FF] text-[#1854E8] text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border border-[#C6D7FE]">
                  {perk.provider}
                </span>
                <span className="bg-[#e6f4ed] text-[#078A57] text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                  {perk.value}
                </span>
              </div>

              <h3 className="text-lg font-bold text-[#101B33] mb-2">
                {perk.title}
              </h3>
              <p className="text-xs md:text-sm text-[#5F6B7A] leading-relaxed mb-6">
                {perk.description}
              </p>
            </div>

            <div className="pt-4 border-t border-[#DEE5EF] flex items-center justify-between">
              <span className="text-xs text-[#5F6B7A] font-medium flex items-center gap-1">
                <ShieldCheck size={14} className="text-[#078A57]" /> Verified Access
              </span>

              <button
                onClick={() => setSelectedPerk(perk)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1854E8] hover:bg-[#1140B8] text-white text-xs font-bold transition-colors shadow-sm"
              >
                Claim Benefit <ArrowRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Claim Instructions Modal */}
      {selectedPerk && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl relative border border-[#DEE5EF]">
            <button
              onClick={() => setSelectedPerk(null)}
              className="absolute right-5 top-5 p-2 rounded-full hover:bg-[#F5F7FB] text-[#5F6B7A]"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="bg-[#e6f4ed] text-[#078A57] text-xs font-bold px-2.5 py-0.5 rounded-full">
                {selectedPerk.value} Value
              </span>
              <span className="text-xs font-semibold text-[#5F6B7A]">Provider: {selectedPerk.provider}</span>
            </div>

            <h3 className="text-2xl font-bold text-[#101B33] mb-3">
              How to Claim {selectedPerk.title}
            </h3>

            <p className="text-sm text-[#5F6B7A] mb-6">
              Follow these simple steps using your CampusOS student credentials to activate your free benefit:
            </p>

            <div className="space-y-3 mb-8">
              {selectedPerk.howToClaim.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-[#F5F7FB] rounded-xl border border-[#DEE5EF]">
                  <span className="w-6 h-6 rounded-full bg-[#1854E8] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="text-xs md:text-sm text-[#101B33] font-medium leading-normal">
                    {step}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between gap-3 pt-4 border-t border-[#DEE5EF]">
              <button
                onClick={() => setSelectedPerk(null)}
                className="px-4 py-2.5 rounded-xl border border-[#DEE5EF] text-[#5F6B7A] text-xs font-semibold hover:bg-[#F5F7FB]"
              >
                Close
              </button>

              <a
                href={selectedPerk.claimUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1854E8] hover:bg-[#1140B8] text-white text-xs font-bold transition-colors shadow-md"
              >
                Go to Partner Claim Page <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
