import { Business } from "../../shared/models/business.model.js";
import { buildBusinessContext } from "../../services/contextBuilder.js";
import { detectIntent } from "../../services/intent.service.js";
import { decideNextStep } from "../../services/agent.service.js";
import { dispatchAction } from "../../services/actionDispatcher.service.js";
import { sendTextMessage } from "../../services/whatsapp.service.js";
import { getState, setState, clearState } from "../../services/state.service.js";
import { ACTIONS } from "../../constants/actionTypes.js";
import { isSunday } from "../../utils/businessRules.js";
import { isAllowed } from "../../services/rateLimiter.service.js";
import { resolveAgentConfig } from "../../services/agentConfig.service.js";
import { resolvePlan } from "../../services/plan.service.js";
import { incrementUsage } from "../../services/usage.service.js";
import { resolveCategory } from "../../services/categoryResolver.service.js";

function log(step, data = null) {
  const tag = `🧭 [${step}]`;
  data ? console.log(tag, JSON.stringify(data, null, 2)) : console.log(tag);
}

export async function handleIncomingMessage({
  phoneNumberId,
  from,
  msgBody
}) {
  log("NEW MESSAGE RECEIVED", {
    business: phoneNumberId,
    user: from,
    message: msgBody
  });

  /* ---------------- BUSINESS ---------------- */
  let business = await Business.findOne({ phoneNumberId });
  if (!business) {
    log("BUSINESS NOT FOUND → CREATE DRAFT");
    business = await Business.create({
      phoneNumberId,
      status: "draft"
    });
  }

  const plan = resolvePlan(business);
  const agentConfig = resolveAgentConfig(business);
  const category = resolveCategory(business);

  log("BUSINESS LOADED", {
    businessId: business._id,
    status: business.status,
    plan: plan.name
  });

  /* ---------------- LIMITS ---------------- */
  const msgKey = `usage:msg:${business._id}:${new Date().getMonth()}`;
  const msgCount = await incrementUsage(msgKey, 30 * 24 * 3600);

  if (msgCount > plan.limits.messagesPerMonth) {
    await sendTextMessage(from, "⚠️ Monthly message limit cross ho gayi hai.");
    return;
  }

  if (!(await isAllowed(`rl:biz:${business._id}`, 300, 3600))) {
    log("BLOCKED: BUSINESS RATE LIMIT");
    return;
  }

  /* ---------------- CONTEXT ---------------- */
  const context = buildBusinessContext(business);
  log("BUSINESS CONTEXT BUILT");

  /* ---------------- AI LIMITS ---------------- */
  if (!(await isAllowed(`rl:ai:${business._id}`, 5, 60))) {
    await sendTextMessage(from, "⚠️ Thoda ruk kar try karein 🙂");
    return;
  }

  const aiKey = `usage:ai:${business._id}:${new Date().toDateString()}`;
  const aiCount = await incrementUsage(aiKey, 24 * 3600);

  if (aiCount > plan.limits.aiCallsPerDay) {
    await sendTextMessage(from, "⚠️ Aaj ke liye AI limit poori ho gayi hai.");
    return;
  }

  /* ---------------- INTENT ---------------- */
  log("DETECTING INTENT");
  const intentResult = await detectIntent({
    context,
    userMessage: msgBody
  });
  log("INTENT RESULT", intentResult);

  if (intentResult.confidence < 0.6) {
    await sendTextMessage(
      from,
      agentConfig.responses?.lowConfidence ||
        "Thoda clear batayenge please 🙂"
    );
    return;
  }

  if (!category.enabledIntents.includes(intentResult.intent)) {
    await sendTextMessage(
      from,
      "Is type ki request abhi supported nahi hai 🙂"
    );
    return;
  }

  /* ---------------- STATE (🔥 FINAL FIX HERE 🔥) ---------------- */
  const stateKey = `${business._id}:${from}`;
  const prevState = getState(stateKey);

  let effectiveIntent = intentResult;

  if (prevState) {
    const mergedEntities = {
      ...prevState.entities,
      ...Object.fromEntries(
        Object.entries(intentResult.entities).filter(
          ([_, value]) => value !== null && value !== undefined
        )
      )
    };

    effectiveIntent = {
      intent: prevState.intent || intentResult.intent,
      confidence: 1,
      entities: mergedEntities
    };

    log("STATE MERGED", effectiveIntent);
  }

  /* ---------------- DECISION ---------------- */
  log("RUNNING DECISION ENGINE");
  const decision = decideNextStep(effectiveIntent, agentConfig);
  log("AGENT DECISION", decision);

  /* ---------------- GUARDS ---------------- */
  if (decision.action && !category.actions?.[decision.action]) {
    await sendTextMessage(
      from,
      "Is action ke liye permission nahi hai."
    );
    return;
  }

  if (
    decision.action === ACTIONS.CREATE_APPOINTMENT &&
    !plan.features.appointmentBooking
  ) {
    await sendTextMessage(
      from,
      "🔒 Appointment booking available nahi hai."
    );
    return;
  }

  if (
    decision.action === ACTIONS.CREATE_APPOINTMENT &&
    agentConfig.rules?.sundayClosed &&
    isSunday(decision.payload?.date)
  ) {
    await sendTextMessage(
      from,
      "❌ Sunday ko clinic band rehta hai."
    );
    return;
  }

  /* ---------------- ACTION ---------------- */
  let result = null;
  if (decision.action && decision.action !== ACTIONS.NONE) {
    log("EXECUTING ACTION", decision.action);
    result = await dispatchAction(decision, {
      businessId: business._id,
      userPhone: from
    });
  }

  /* ---------------- STATE UPDATE ---------------- */
  if (
    decision.action === ACTIONS.ASK_CLARIFICATION ||
    decision.action === ACTIONS.ASK_MISSING_INFO
  ) {
    setState(stateKey, effectiveIntent);
  } else {
    clearState(stateKey);
  }

  /* ---------------- REPLY ---------------- */
  let finalMessage = decision.message;

  if (decision.action === ACTIONS.CREATE_TICKET && result?._id) {
    finalMessage = finalMessage.replace(
      "{{ticketId}}",
      result._id.toString()
    );
  }

  if (finalMessage) {
    await sendTextMessage(from, finalMessage);
    log("REPLY SENT", finalMessage);
  }

  log("FLOW COMPLETE ✅");
}
