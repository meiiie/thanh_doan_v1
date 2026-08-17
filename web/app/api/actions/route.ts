import { NextResponse } from "next/server";
import { getActor } from "@/app/auth";
import {
  addUser,
  claimIdempotency,
  saveAssessment,
  saveExplanation,
  saveReview,
  setAssessmentApplicability,
  setUserActive,
  submitUnit,
  transitionCampaign,
  updateCampaignSettings,
} from "@/db/app";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response("Forbidden", { status: 403 });
  const form = await request.formData();
  const action = field(form, "action");
  const demo = optionalField(form, "demo");
  const actor = await getActor(demo);
  if (!actor) return new Response("Unauthorized", { status: 401 });
  const returnTo = safeReturnTo(optionalField(form, "returnTo"));

  try {
    const key = field(form, "idempotencyKey");
    if (!(await claimIdempotency(actor, key, action))) {
      throw new Error("DUPLICATE_ACTION");
    }

    switch (action) {
      case "saveAssessment":
        await saveAssessment(actor, {
          assessmentId: field(form, "assessmentId"),
          score: numberField(form, "score"),
          report: optionalField(form, "report"),
          evidenceUrl: optionalField(form, "evidenceUrl"),
        });
        return redirectWith(request, returnTo, "success", "saved");
      case "setAssessmentApplicability":
        await setAssessmentApplicability(actor, {
          assessmentId: field(form, "assessmentId"),
          applicable: field(form, "applicable") === "1",
        });
        return redirectWith(request, returnTo, "success", "applicabilityChanged");
      case "submitUnit":
        await submitUnit(actor);
        return redirectWith(request, returnTo, "success", "submitted");
      case "saveReview":
        await saveReview(actor, {
          assessmentId: field(form, "assessmentId"),
          score: numberField(form, "score"),
          reason: optionalField(form, "reason"),
        });
        return redirectWith(request, returnTo, "success", "saved");
      case "saveExplanation":
        await saveExplanation(actor, {
          assessmentId: field(form, "assessmentId"),
          message: field(form, "message"),
          evidenceUrl: optionalField(form, "evidenceUrl"),
        });
        return redirectWith(request, returnTo, "success", "saved");
      case "transitionCampaign":
        await transitionCampaign(
          actor,
          field(form, "nextPhase"),
          optionalField(form, "reason"),
        );
        return redirectWith(request, returnTo, "success", "transitioned");
      case "updateCampaignSettings":
        await updateCampaignSettings(actor, {
          name: field(form, "name"),
          selfDeadline: field(form, "selfDeadline"),
        });
        return redirectWith(request, returnTo, "success", "campaignUpdated");
      case "addUser":
        await addUser(actor, {
          email: field(form, "email"),
          displayName: field(form, "displayName"),
          role: field(form, "role"),
          teamCode: optionalField(form, "teamCode"),
          unitId: optionalField(form, "unitId"),
        });
        return redirectWith(request, returnTo, "success", "userAdded");
      case "setUserActive":
        await setUserActive(actor, {
          userId: field(form, "userId"),
          active: field(form, "active") === "1",
        });
        return redirectWith(request, returnTo, "success", "userStatusChanged");
      default:
        throw new Error("INVALID_ACTION");
    }
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    return redirectWith(request, returnTo, "error", safeErrorCode(code));
  }
}

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

function field(form: FormData, key: string) {
  const value = form.get(key);
  if (typeof value !== "string" || !value.trim()) throw new Error("INVALID_INPUT");
  return value.trim();
}

function optionalField(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function numberField(form: FormData, key: string) {
  const value = Number(field(form, key));
  if (!Number.isFinite(value)) throw new Error("INVALID_SCORE");
  return value;
}

function safeReturnTo(value: string) {
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  const url = new URL(value, "https://app.local");
  return `${url.pathname}${url.search}`;
}

function redirectWith(
  request: Request,
  returnTo: string,
  key: "success" | "error",
  value: string,
) {
  const target = new URL(returnTo, request.url);
  target.searchParams.set(key, value);
  return NextResponse.redirect(target, 303);
}

function safeErrorCode(value: string) {
  return /^[A-Z0-9_]{3,50}$/.test(value) ? value : "UNKNOWN_ERROR";
}
