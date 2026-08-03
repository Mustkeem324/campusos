export interface AiChatMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
}

export interface AiCitationItem {
  title: string;
  category: string;
  snippet: string;
  sourceUrl?: string;
}

export interface AiToolProposal {
  actionName: string;
  targetRecord: string;
  currentValues?: Record<string, any>;
  proposedValues: Record<string, any>;
  reason: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'PROHIBITED';
  requiredPermission: string;
}

export interface AiResponse {
  content: string;
  modelUsed: string;
  promptTokens: number;
  completionTokens: number;
  citations: AiCitationItem[];
  proposals: AiToolProposal[];
  promptInjectionBlocked: boolean;
}

export class AiProviderService {
  static async generateChatResponse(options: {
    userRole: string;
    prompt: string;
    conversationHistory?: AiChatMessage[];
    contextData?: string;
    citations?: AiCitationItem[];
    tenantId: string;
  }): Promise<AiResponse> {
    const { userRole, prompt, citations = [], contextData = '' } = options;

    let responseContent = '';
    const proposals: AiToolProposal[] = [];

    // Analyze prompt intent for role-aware answers & action proposals
    const lowerPrompt = prompt.toLowerCase();

    if (userRole === 'STUDENT') {
      if (lowerPrompt.includes('attendance') || lowerPrompt.includes('shortage')) {
        responseContent = `Based on your academic record in B.Tech CSE (Year 2), your current overall attendance is **94.2%** across 6 courses. You have 0 attendance shortages. According to the *University Attendance & Examination Eligibility Policy 2026*, you require a minimum of 75% attendance to sit for end-semester exams.`;
      } else if (lowerPrompt.includes('timetable') || lowerPrompt.includes('class') || lowerPrompt.includes('today')) {
        responseContent = `Here is your schedule for today:\n- **09:00 AM**: CS-301 Data Structures (Lab 4)\n- **11:30 AM**: CS-302 Operating Systems (Room 201)\n- **02:00 PM**: MA-201 Discrete Mathematics (Lecture Hall B)`;
      } else if (lowerPrompt.includes('fee') || lowerPrompt.includes('due') || lowerPrompt.includes('pay')) {
        responseContent = `Your tuition fees for Semester 4 are fully paid (₹0 outstanding). Your next installment of ₹45,000 is due on July 15, 2026.`;
        proposals.push({
          actionName: 'Generate Fee Statement Draft',
          targetRecord: 'Invoice #INV-2026-004',
          currentValues: { amount: 0, status: 'PAID' },
          proposedValues: { requestType: 'PDF_DOWNLOAD' },
          reason: 'Student requested fee breakdown summary',
          riskLevel: 'LOW',
          requiredPermission: 'student:fees:read',
        });
      } else if (lowerPrompt.includes('service') || lowerPrompt.includes('request') || lowerPrompt.includes('helpdesk')) {
        responseContent = `I can help you draft a student service request for transcript issuance or ID card replacement. Please confirm the proposed action below to submit it to the registrar.`;
        proposals.push({
          actionName: 'Submit Transcript Service Request Draft',
          targetRecord: 'StudentServiceRequest',
          proposedValues: { category: 'TRANSCRIPT', priority: 'NORMAL', details: 'Request for official transcript copy' },
          reason: 'Student requested transcript service creation',
          riskLevel: 'MEDIUM',
          requiredPermission: 'student:requests:create',
        });
      } else {
        responseContent = `I have searched the institutional knowledge base. ${contextData ? `Here is relevant information from institutional policies:\n\n${contextData}` : 'I am here to assist you with your courses, timetable, attendance calculations, fee statements, and university policies.'}`;
      }
    } else if (userRole === 'FACULTY') {
      if (lowerPrompt.includes('quiz') || lowerPrompt.includes('question') || lowerPrompt.includes('assignment')) {
        responseContent = `I have prepared a draft quiz outline for CS-301 Data Structures (Topic: Binary Search Trees). Review the proposed assignment draft below before publishing to your students.`;
        proposals.push({
          actionName: 'Create Assignment Draft',
          targetRecord: 'Course #CS-301',
          proposedValues: { title: 'BST Implementation Quiz', totalPoints: 20, dueDate: '2026-08-10' },
          reason: 'Faculty requested automated quiz draft generation',
          riskLevel: 'MEDIUM',
          requiredPermission: 'faculty:assignments:create',
        });
      } else if (lowerPrompt.includes('risk') || lowerPrompt.includes('at-risk') || lowerPrompt.includes('attendance')) {
        responseContent = `In your CS-301 section, 2 out of 45 students are currently flagged for attendance below 75% threshold (Rohan Verma: 72%, Ananya Patel: 68%). I recommend scheduling a review session.`;
      } else {
        responseContent = `As a Faculty member, I can help you outline lesson plans, draft quiz questions, review student attendance shortages, and prepare course announcements.`;
      }
    } else {
      responseContent = `CampusOS AI Assistant is ready. I can assist with institutional metrics, risk reviews, fee collection summaries, policy lookup, and workflow draft generation.`;
    }

    return {
      content: responseContent,
      modelUsed: 'campusos-mock-v1',
      promptTokens: Math.ceil(prompt.length / 4) + 50,
      completionTokens: Math.ceil(responseContent.length / 4),
      citations,
      proposals,
      promptInjectionBlocked: false,
    };
  }
}
