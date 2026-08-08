import { NextResponse } from 'next/server';
import { requireTenantContext } from '@/lib/tenant-context';
import { SCENARIO_CATALOGUE } from '@/lib/demo/scenarios';

export const dynamic = 'force-dynamic';

export async function POST(
  req: Request,
  { params: paramsPromise }: { params: Promise<{ instanceId: string; stepId: string }>; }) {
  const params = await paramsPromise;

  try {
    const { db, role, session, tenantId } = await requireTenantContext();

    if (process.env.DEMO_MODE !== 'true') {
      return NextResponse.json({ error: 'Demo mode is currently disabled' }, { status: 403 });
    }

    const instance = await db.demoScenarioInstance.findUnique({
      where: { id: params.instanceId, tenantId },
    });

    if (!instance) {
      return NextResponse.json({ error: 'Scenario instance not found' }, { status: 404 });
    }

    const scenario = SCENARIO_CATALOGUE.find((s) => s.id === instance.scenarioId);
    if (!scenario) {
      return NextResponse.json({ error: 'Scenario definition not found' }, { status: 404 });
    }

    const requestedStepNumber = parseInt(params.stepId, 10);
    const stepDef = scenario.steps.find((s) => s.stepNumber === requestedStepNumber);

    if (!stepDef) {
      return NextResponse.json({ error: 'Invalid step number' }, { status: 400 });
    }

    if (requestedStepNumber !== instance.currentStep) {
      return NextResponse.json({
        error: `Cannot execute step ${requestedStepNumber}. Active step is ${instance.currentStep}.`
      }, { status: 400 });
    }

    if (role !== stepDef.role && !(role === 'SUPER_ADMIN' || role === 'INSTITUTION_ADMIN')) {
      return NextResponse.json({
        error: `Step ${requestedStepNumber} requires role ${stepDef.role}. Current active role is ${role}.`
      }, { status: 403 });
    }

    const isFinalStep = requestedStepNumber >= scenario.totalSteps;
    const nextStep = isFinalStep ? requestedStepNumber : requestedStepNumber + 1;
    const nextStatus = isFinalStep ? 'COMPLETED' : stepDef.nextRole && stepDef.nextRole !== role ? 'WAITING_FOR_ROLE' : 'ACTION_REQUIRED';

    const updatedInstance = await db.demoScenarioInstance.update({
      where: { id: instance.id },
      data: {
        currentStep: nextStep,
        status: nextStatus,
        completedAt: isFinalStep ? new Date() : null,
      },
      include: {
        events: {
          orderBy: { stepIndex: 'asc' },
        },
      },
    });

    await db.demoScenarioEvent.create({
      data: {
        instanceId: instance.id,
        tenantId,
        stepIndex: requestedStepNumber,
        actorPersona: stepDef.actorPersona,
        actorRole: role,
        action: stepDef.actionKey,
        module: stepDef.module,
        result: stepDef.expectedResult,
        nextRole: stepDef.nextRole,
      },
    });

    await db.auditLog.create({
      data: {
        tenantId,
        userId: session.userId,
        action: `DEMO_STEP_${stepDef.actionKey}`,
        entity: 'DemoScenarioInstance',
        diffJson: JSON.stringify({ scenarioId: scenario.id, stepNumber: requestedStepNumber, role }),
      },
    });

    return NextResponse.json({
      success: true,
      instance: updatedInstance,
      stepExecuted: stepDef,
      whatChanged: {
        status: stepDef.expectedResult,
        permissionReason: stepDef.explanation,
        nextRole: stepDef.nextRole,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unable to execute scenario step';
    const status = message.startsWith('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
