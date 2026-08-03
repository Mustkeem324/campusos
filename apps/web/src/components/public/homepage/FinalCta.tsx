import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function FinalCta() {
  return (
    <section className="bg-[#14213D] py-24">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 xl:px-12 text-center">
        <div className="max-w-[800px] mx-auto">
          <h2 className="text-3xl md:text-4xl lg:text-[42px] font-bold text-white mb-6">
            Ready to modernise your institution?
          </h2>
          <p className="text-[17px] md:text-[19px] text-[#BEC7D7] leading-[1.6] mb-10 max-w-[680px] mx-auto">
            See how CampusOS can connect academics, administration and student services in one secure platform.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              href="/demo" 
              className="px-8 py-4 rounded-lg bg-[#1854E8] text-white font-semibold hover:bg-[#123FC0] transition-colors flex items-center justify-center text-[16px]"
            >
              Book a Demo
            </Link>
            <Link 
              href="/contact" 
              className="px-8 py-4 rounded-lg bg-transparent border border-white text-white font-semibold hover:bg-white/10 transition-colors flex items-center justify-center text-[16px]"
            >
              Contact Sales
            </Link>
          </div>
          <p className="text-[13px] text-[#8A94A6] mt-8">
            Typically responds within 24 hours to schedule a consultation.
          </p>
        </div>
      </div>
    </section>
  );
}
