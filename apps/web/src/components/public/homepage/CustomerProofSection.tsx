import React from 'react';

const models = ['Public universities', 'Private universities', 'Autonomous colleges', 'Community colleges', 'Engineering institutions', 'Medical institutions', 'Online education providers'];

export function CustomerProofSection() {
  return <section className="border-y border-[#DFE6F0] bg-[#F6F8FC] py-16 md:py-20"><div className="mx-auto max-w-[1440px] px-4 text-center md:px-6 lg:px-10 xl:px-12"><p className="text-xs font-bold tracking-[.14em] text-[#1754E8]">INSTITUTIONAL MODELS</p><h2 className="mx-auto mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-[#101A32] md:text-4xl">Built for institutions across diverse higher-education models</h2><div className="mx-auto mt-8 flex max-w-5xl flex-wrap justify-center gap-3">{models.map(model => <span key={model} className="rounded-md border border-[#CAD4E2] bg-white px-4 py-3 text-sm font-medium text-[#5F6C7B]">{model}</span>)}</div><p className="mt-7 text-sm text-[#5F6C7B]">Customer references available during qualified procurement discussions.</p></div></section>;
}
