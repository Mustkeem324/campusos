import React from 'react';

const stages = [
  { id: '1', title: 'Discovery', task: 'Process mapping and requirements gathering', output: 'Implementation Blueprint', team: 'CampusOS & Institution' },
  { id: '2', title: 'Configuration', task: 'System setup and module parameterization', output: 'Configured Instance', team: 'CampusOS Engineers' },
  { id: '3', title: 'Data Migration', task: 'Cleaning and importing legacy records', output: 'Populated Database', team: 'CampusOS Data Team' },
  { id: '4', title: 'Validation', task: 'UAT and edge-case testing', output: 'Sign-off Document', team: 'Institution Core Team' },
  { id: '5', title: 'Training', task: 'Role-based capability training', output: 'Trained Champions', team: 'CampusOS Success' },
  { id: '6', title: 'Pilot & Go-Live', task: 'Phased rollout to active users', output: 'Live System', team: 'Joint Taskforce' }
];

export function ImplementationJourney() {
  return (
    <section className="bg-[#F5F7FB] py-24 md:py-32">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 xl:px-12">
        <div className="text-center mb-16">
          <span className="text-[12px] md:text-[13px] font-semibold text-[#1854E8] tracking-[0.08em] uppercase mb-4 block">
            IMPLEMENTATION JOURNEY
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-[42px] font-bold text-[#101B33] mb-6">
            A structured path to digital transformation
          </h2>
          <p className="text-[17px] text-[#5F6B7A] max-w-[680px] mx-auto">
            We don&apos;t just hand over software. Our dedicated deployment team guides your institution through a proven six-stage methodology to ensure absolute success.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stages.map((stage) => (
            <div key={stage.id} className="bg-white border border-[#DEE5EF] rounded-xl p-6 shadow-sm flex flex-col">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-md bg-[#EEF3FF] text-[#1854E8] flex items-center justify-center font-bold text-[14px]">
                  {stage.id}
                </div>
                <h3 className="text-[18px] font-semibold text-[#101828]">{stage.title}</h3>
              </div>
              
              <div className="flex flex-col gap-4 flex-1">
                <div>
                  <div className="text-[11px] font-bold text-[#5F6B7A] uppercase tracking-wider mb-1">Main Task</div>
                  <div className="text-[14px] text-[#101828]">{stage.task}</div>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-[#5F6B7A] uppercase tracking-wider mb-1">Output</div>
                  <div className="text-[14px] text-[#101828] font-medium">{stage.output}</div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#DEE5EF]">
                <div className="text-[12px] font-medium text-[#5F6B7A] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#1854E8]"></span>
                  {stage.team}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
