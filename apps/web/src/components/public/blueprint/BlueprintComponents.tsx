'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, ArrowRight, X, Filter, Download, ArrowUpRight, Clock, Box } from 'lucide-react';
import { blueprintTopics, BlueprintTopic, BlueprintCategory, BlueprintAudience } from './BlueprintData';
import { renderTopicDetail } from './BlueprintDetails';

export function BlueprintHero() {
  return (
    <div className="bg-[#F5F7FB] pt-24 pb-20 border-b border-[#DFE6F0] relative overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 md:px-10 xl:px-14 flex flex-col lg:flex-row items-center gap-16 relative z-10">
        
        {/* Left Column */}
        <div className="w-full lg:w-[48%] shrink-0">
          <span className="text-[12px] font-bold text-[#1754E8] tracking-widest uppercase mb-4 block">
            CampusOS Product Architecture
          </span>
          <h1 className="text-[36px] lg:text-[56px] font-bold text-[#101828] leading-[1.1] mb-6">
            We understand how institutions operate.<br />
            Here is how CampusOS is built.
          </h1>
          <p className="text-[17px] text-[#5F6C7B] leading-relaxed mb-8 max-w-[500px]">
            Explore the principles, systems, controls and technology behind the CampusOS university operating system.
          </p>
          
          <div className="flex flex-wrap gap-4 mb-10">
            <a href="#directory" className="px-6 py-3 bg-[#1754E8] hover:bg-[#103FC2] text-white font-semibold rounded text-sm transition-colors shadow-sm">
              Explore the Blueprint
            </a>
            <button className="px-6 py-3 bg-white hover:bg-[#F5F7FB] border border-[#DFE6F0] text-[#1754E8] font-semibold rounded text-sm transition-colors shadow-sm flex items-center gap-2">
              <Download size={16} /> Download Architecture Overview
            </button>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] font-medium text-[#5F6C7B]">
            <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#078A57]"></div> Multi-tenant foundation</span>
            <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#078A57]"></div> Permission-aware workflows</span>
            <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#078A57]"></div> Auditable AI actions</span>
          </div>
        </div>

        {/* Right Visual: Interactive Node Map */}
        <div className="w-full lg:w-[52%] h-[400px] lg:h-[500px] bg-white border border-[#DFE6F0] rounded-2xl shadow-sm relative flex items-center justify-center overflow-hidden">
          {/* Decorative Grid */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
          
          <div className="relative z-10 flex flex-col items-center justify-center w-full h-full p-8">
            <div className="w-32 h-32 bg-[#0F1A30] rounded-full flex flex-col items-center justify-center text-white shadow-lg border-[4px] border-[#EEF2F7] z-20 hover:scale-105 transition-transform cursor-pointer relative">
              <Box size={28} className="text-[#1754E8] mb-1" />
              <span className="font-bold text-sm tracking-wide">CORE</span>
              
              {/* Foundation Ring Labels */}
              <div className="absolute -bottom-8 whitespace-nowrap text-[10px] font-bold text-[#5F6C7B] tracking-widest uppercase">
                Identity • Audit • Workflow
              </div>
            </div>

            {/* Orbiting system nodes (static positioning for solid robust feel) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[280px] h-[280px] rounded-full border border-[#DFE6F0] absolute"></div>
              <div className="w-[420px] h-[420px] rounded-full border border-[#DFE6F0] absolute border-dashed opacity-50"></div>
              
              {/* System Nodes */}
              <div className="absolute top-[15%] left-[20%] w-24 p-2 bg-white border border-[#C9D4E2] text-center rounded text-[11px] font-bold text-[#101828] shadow-sm pointer-events-auto hover:border-[#1754E8] cursor-pointer">Academics</div>
              <div className="absolute top-[15%] right-[20%] w-24 p-2 bg-white border border-[#C9D4E2] text-center rounded text-[11px] font-bold text-[#101828] shadow-sm pointer-events-auto hover:border-[#1754E8] cursor-pointer">Finance</div>
              <div className="absolute bottom-[20%] left-[15%] w-24 p-2 bg-white border border-[#C9D4E2] text-center rounded text-[11px] font-bold text-[#101828] shadow-sm pointer-events-auto hover:border-[#1754E8] cursor-pointer">Learning</div>
              <div className="absolute bottom-[20%] right-[15%] w-24 p-2 bg-white border border-[#C9D4E2] text-center rounded text-[11px] font-bold text-[#101828] shadow-sm pointer-events-auto hover:border-[#1754E8] cursor-pointer">People</div>
              <div className="absolute top-[45%] right-[8%] w-24 p-2 bg-[#F5F7FB] border border-[#1754E8] text-[#1754E8] text-center rounded text-[11px] font-bold shadow-sm pointer-events-auto cursor-pointer">Platform AI</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export function BlueprintTopicCard({ topic, selected, onSelect }: { topic: BlueprintTopic, selected: boolean, onSelect: () => void }) {
  return (
    <button 
      onClick={onSelect}
      className={`text-left w-full h-full p-6 lg:p-8 flex flex-col justify-between rounded-xl transition-all border outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8] ${
        selected 
        ? 'bg-[#EDF3FF] border-[#1754E8] shadow-sm' 
        : 'bg-white border-[#DFE6F0] hover:border-[#C9D4E2] hover:shadow-sm hover:-translate-y-0.5'
      } ${topic.featured ? 'md:col-span-2' : 'col-span-1'}`}
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-[11px] font-bold text-[#1754E8] tracking-widest uppercase">{topic.number} — {topic.label}</span>
          <ArrowRight size={16} className={`transition-transform ${selected ? 'text-[#1754E8] translate-x-1' : 'text-[#8A95A6]'}`} />
        </div>
        <h3 className={`text-xl lg:text-2xl font-bold mb-3 ${selected ? 'text-[#103FC2]' : 'text-[#101828]'}`}>
          {topic.question}
        </h3>
        <p className={`text-[15px] leading-relaxed ${selected ? 'text-[#1754E8]' : 'text-[#5F6C7B]'}`}>
          {topic.description}
        </p>
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-[#DFE6F0]/50 pt-4">
        <div className="flex gap-2 flex-wrap">
          {topic.audiences.slice(0, 2).map(aud => (
            <span key={aud} className="px-2 py-1 bg-[#F5F7FB] text-[#5F6C7B] text-[10px] font-bold uppercase tracking-wider rounded">
              {aud}
            </span>
          ))}
          {topic.audiences.length > 2 && <span className="px-2 py-1 bg-[#F5F7FB] text-[#5F6C7B] text-[10px] font-bold rounded">+{topic.audiences.length - 2}</span>}
        </div>
        <span className="flex items-center gap-1.5 text-[12px] font-medium text-[#8A95A6]">
          <Clock size={12} /> {topic.readingTime}
        </span>
      </div>
    </button>
  );
}

export function BlueprintDirectory() {
  const [search, setSearch] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  const filteredTopics = blueprintTopics.filter(t => 
    t.question.toLowerCase().includes(search.toLowerCase()) || 
    t.description.toLowerCase().includes(search.toLowerCase()) ||
    t.label.toLowerCase().includes(search.toLowerCase()) ||
    t.category.toLowerCase().includes(search.toLowerCase())
  );

  const activeTopicObj = blueprintTopics.find(t => t.id === selectedTopic);

  // Sync with URL hash
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash && blueprintTopics.some(t => t.id === hash)) {
      setSelectedTopic(hash);
    }
  }, []);

  const handleSelect = (id: string) => {
    setSelectedTopic(id);
    window.history.pushState(null, '', `#${id}`);
  };

  return (
    <div id="directory" className="py-20 lg:py-28 relative bg-white">
      <div className="max-w-[1440px] mx-auto px-4 md:px-10 xl:px-14 flex flex-col lg:flex-row gap-12 items-start">
        
        {/* Main Content Area */}
        <div className="flex-1 w-full">
          <div className="mb-12">
            <h2 className="text-3xl lg:text-[40px] font-bold text-[#101828] mb-4">Explore the CampusOS Blueprint</h2>
            <p className="text-[17px] text-[#5F6C7B]">Select an area to understand the design decisions behind the platform.</p>
          </div>

          {/* Search Bar */}
          <div className="mb-10 flex gap-4">
            <div className="relative flex-1 max-w-md">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A95A6]" />
              <input 
                type="text" 
                placeholder="Search topics, architectures, features..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-[#F5F7FB] border border-[#DFE6F0] rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-[#1754E8] transition-all"
              />
            </div>
            <button className="px-4 py-3 bg-white border border-[#DFE6F0] text-[#5F6C7B] hover:bg-[#F5F7FB] rounded-lg font-medium text-sm flex items-center gap-2">
              <Filter size={18} /> Filters
            </button>
          </div>

          {/* Topics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTopics.map((topic) => (
              <BlueprintTopicCard 
                key={topic.id} 
                topic={topic} 
                selected={selectedTopic === topic.id} 
                onSelect={() => handleSelect(topic.id)} 
              />
            ))}
            {filteredTopics.length === 0 && (
              <div className="col-span-full py-20 text-center text-[#5F6C7B]">
                <p>No architecture topics found for &quot;{search}&quot;.</p>
              </div>
            )}
          </div>
        </div>

        {/* Detail Side Panel (Desktop) */}
        {selectedTopic && activeTopicObj && (
          <div className="hidden lg:block w-[450px] shrink-0 sticky top-24 bg-white border border-[#DFE6F0] rounded-2xl shadow-xl overflow-hidden flex-col h-[calc(100vh-120px)] animate-in slide-in-from-right-8 duration-300">
            <div className="px-8 py-6 border-b border-[#DFE6F0] flex justify-between items-start bg-[#F5F7FB]">
              <div>
                <span className="text-[10px] font-bold text-[#1754E8] tracking-widest uppercase mb-2 block">{activeTopicObj.number} — {activeTopicObj.label}</span>
                <h3 className="text-2xl font-bold text-[#101828]">{activeTopicObj.question}</h3>
              </div>
              <button onClick={() => setSelectedTopic(null)} className="p-2 hover:bg-[#E2E8F0] rounded text-[#5F6C7B]">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
              {renderTopicDetail(activeTopicObj)}
            </div>
            <div className="p-6 border-t border-[#DFE6F0] bg-white">
              <Link href="/demo" className="w-full py-3 bg-[#1754E8] hover:bg-[#103FC2] text-white font-semibold rounded text-sm transition-colors text-center block">
                Book a Technical Demo
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Detail Mobile Sheet */}
      {selectedTopic && activeTopicObj && (
        <div className="lg:hidden fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedTopic(null)}></div>
          <div className="relative w-full max-w-md bg-white h-full flex flex-col animate-in slide-in-from-bottom lg:slide-in-from-right duration-300">
            <div className="px-6 py-6 border-b border-[#DFE6F0] flex justify-between items-start bg-[#F5F7FB]">
              <div>
                <span className="text-[10px] font-bold text-[#1754E8] tracking-widest uppercase mb-1 block">{activeTopicObj.number} — {activeTopicObj.label}</span>
                <h3 className="text-xl font-bold text-[#101828] leading-tight">{activeTopicObj.question}</h3>
              </div>
              <button onClick={() => setSelectedTopic(null)} className="p-2 hover:bg-[#E2E8F0] rounded text-[#5F6C7B]">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {renderTopicDetail(activeTopicObj)}
            </div>
            <div className="p-4 border-t border-[#DFE6F0] bg-white">
              <Link href="/demo" className="w-full py-3 bg-[#1754E8] hover:bg-[#103FC2] text-white font-semibold rounded text-sm transition-colors text-center block">
                Book a Technical Demo
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function BlueprintFinalCta() {
  return (
    <div className="bg-[#0F1A30] py-24 text-center px-4">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-[44px] font-bold text-white mb-6 leading-tight">
          See the blueprint operating on a real institution.
        </h2>
        <p className="text-[17px] text-[#B9C3D4] mb-10 max-w-2xl mx-auto">
          Walk through the platform architecture, workflows, permissions and integrations with a CampusOS product specialist.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/demo" className="px-8 py-3.5 bg-white text-[#0F1A30] hover:bg-[#F5F7FB] font-semibold rounded text-[15px] transition-colors">
            Book a Technical Demo
          </Link>
          <Link href="/contact" className="px-8 py-3.5 border border-[#475467] text-white hover:bg-[#17243D] font-semibold rounded text-[15px] transition-colors">
            Contact Architecture Team
          </Link>
        </div>
      </div>
    </div>
  );
}
