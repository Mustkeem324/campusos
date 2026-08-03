import { prisma } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { FileText, ShieldCheck, Database, Upload, CheckCircle2 } from 'lucide-react';

export default async function InstitutionalKnowledgePage() {
  const session = await getSessionFromCookies();
  if (!session) {
    redirect('/login');
  }

  const documents = await prisma.aiKnowledgeDocument.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-[#101828]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#DFE6F0] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-7 h-7 text-[#1754E8]" />
            <h1 className="text-2xl font-bold text-[#101A32]">Institutional Knowledge & RAG Library</h1>
          </div>
          <p className="text-sm text-[#5F6C7B] mt-1">
            Manage approved institutional documents, academic regulations, fee rules, and hostel guidelines indexed for RAG retrieval.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-[#078A57] text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Tenant Isolated Index</span>
          </span>
        </div>
      </div>

      {/* Document Table */}
      <div className="bg-white border border-[#DFE6F0] rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#DFE6F0] flex justify-between items-center bg-[#F6F8FC]">
          <h2 className="text-base font-bold text-[#101A32] flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#1754E8]" />
            <span>Approved Knowledge Sources ({documents.length})</span>
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#DFE6F0] bg-[#F6F8FC] text-xs font-semibold text-[#5F6C7B] uppercase tracking-wider">
                <th className="p-3.5">Title</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Audience</th>
                <th className="p-3.5">Classification</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Effective Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DFE6F0]">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-[#F6F8FC] transition-colors">
                  <td className="p-3.5 font-medium text-[#101828]">{doc.title}</td>
                  <td className="p-3.5 text-[#5F6C7B]">{doc.category}</td>
                  <td className="p-3.5 text-[#5F6C7B]">{doc.audience}</td>
                  <td className="p-3.5">
                    <span className="bg-[#EDF3FF] text-[#1754E8] text-xs font-bold px-2 py-0.5 rounded">
                      {doc.classification}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-[#078A57] bg-[#E6F4ED] px-2 py-0.5 rounded">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {doc.publicationStatus}
                    </span>
                  </td>
                  <td className="p-3.5 text-[#5F6C7B]">
                    {new Date(doc.effectiveDate).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
