import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { calculateTotalRepayable } from "@/lib/loan-calculator";
import { getAsOfDate } from "@/lib/date-utils";
import { createAuditLog } from "@/lib/audit-log";
import { applyBnplRepayment } from "@/lib/bnpl-repayment";
import { syncCbsDeletionForBorrower } from "@/actions/cbs-npl";

// Function to validate the token from the Authorization header
async function validateAuthHeader(authHeader: string | null) {
  const TOKEN_VALIDATION_API_URL = process.env.TOKEN_VALIDATION_API_URL;
  if (!TOKEN_VALIDATION_API_URL) {
    throw new Error("Token validation URL is not configured.");
  }
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Authorization header is malformed or missing.");
  }

  const response = await fetch(TOKEN_VALIDATION_API_URL, {
    method: "GET",
    headers: {
      Authorization: authHeader,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error("Token validation failed:", errorData);
    throw new Error("External token validation failed.");
  }

  return true;
}

export async function POST(request: NextRequest) {
  let requestBody;
  try {
    requestBody = await request.json();
    // Log incoming payload and headers for debugging

    // ✅ Extract and normalize Authorization header
    const authHeader = request.headers.get("Authorization");

    // Extract token if format is like: Bearer {"token":"YOUR_TOKEN"}
    let fixedAuthHeader: string | null = null;
    console.log("[PAYMENT_CALLBACK] Raw Authorization header", { authHeader });

    if (authHeader) {
      // Match both quoted or unquoted token values
      const tokenMatch = authHeader.match(/"token"\s*:\s*"([^"]+)"/);
      const rawToken = tokenMatch?.[1];

      // If found, reconstruct standard Bearer token format
      fixedAuthHeader = rawToken ? `Bearer ${rawToken}` : authHeader;
      console.log("[PAYMENT_CALLBACK] Fixed Authorization header", { fixedAuthHeader });
    }

    if (!fixedAuthHeader) {
      throw new Error("Invalid Authorization header format.");
    }

    // ✅ Validate fixed token
    await validateAuthHeader(fixedAuthHeader);
  } catch (e: any) {
    console.error("Callback Error: Initial validation failed.", e);
    return NextResponse.json(
      { message: e.message || "Authentication or parsing error." },
      { status: 400 }
    );
  }

  const {
    paidAmount,
    paidByNumber,
    txnRef,
    transactionId,
    transactionTime,
    accountNo,
    token,
    Signature: receivedSignature,
  } = requestBody;

  // --- Determine payment type: BNPL or DIRECT ---
  // Check both PendingPayment (BNPL) and DirectPendingPayment (DIRECT) by txnRef
  let paymentType: "BNPL" | "DIRECT" = "BNPL";
  const bnplPending = await prisma.pendingPayment.findUnique({
    where: { transactionId: txnRef },
  });
  const directPending = !bnplPending
    ? await (prisma as any).directPendingPayment.findUnique({
        where: { transactionId: txnRef },
      })
    : null;

  if (directPending) {
    paymentType = "DIRECT";
  }

  // --- Log payment transaction ---
  try {
    const existing = await prisma.paymentTransaction.findFirst({
      where: {
        OR: [
          transactionId ? { transactionId: transactionId } : undefined,
          txnRef ? { txnRef: txnRef } : undefined,
        ].filter(Boolean) as any,
      },
    });

    if (existing) {
      const existingAny: any = existing;
      await prisma.paymentTransaction.update({
        where: { id: existing.id },
        data: {
          status: "RECEIVED",
          payload: JSON.stringify(requestBody),
          paymentType,
          transactionId: transactionId || existingAny.transactionId,
          txnRef: txnRef || existingAny.txnRef,
        } as any,
      });
    } else {
      await prisma.paymentTransaction.create({
        data: {
          transactionId: transactionId || txnRef,
          txnRef: txnRef,
          paymentType,
          status: "RECEIVED",
          payload: JSON.stringify(requestBody),
        } as any,
      });
    }
  } catch (e) {
    console.error("Failed to log payment transaction:", e);
  }

  // --- Route to DIRECT payment handler ---
  if (paymentType === "DIRECT" && directPending) {
    try {
      if (directPending.status === "COMPLETED") {
        return NextResponse.json(
          { message: "Payment already processed." },
          { status: 200 }
        );
      }

      const { orderId, borrowerId, merchantId, amount: expectedAmount } = directPending;

      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order) {
        throw new Error(`Order ${orderId} not found.`);
      }

      if (order.status === "ON_DELIVERY" || order.status === "PENDING_MERCHANT_CONFIRMATION") {
        await prisma.order.update({
          where: { id: orderId },
          data: { status: "DELIVERED" },
        });
      }

      await (prisma as any).directPendingPayment.update({
        where: { transactionId: txnRef },
        data: { status: "COMPLETED" },
      });

      await prisma.paymentTransaction.updateMany({
        where: {
          OR: [
            transactionId ? { transactionId } : undefined,
            txnRef ? { txnRef } : undefined,
          ].filter(Boolean) as any,
        },
        data: { status: "PROCESSED" } as any,
      });

      await createAuditLog({
        actorId: borrowerId,
        action: "DIRECT_PAYMENT_SUCCESS",
        entity: "ORDER",
        entityId: orderId,
        details: {
          transactionId,
          txnRef,
          paidAmount,
          merchantId,
          expectedAmount,
        },
      });

      return NextResponse.json(
        { message: "Direct payment processed successfully." },
        { status: 200 }
      );
    } catch (e: any) {
      console.error("Direct Payment Callback processing error:", e);
      return NextResponse.json(
        { message: e.message || "Internal processing error." },
        { status: 500 }
      );
    }
  }

  // --- Route to BNPL payment handler ---
  try {
    if (!bnplPending) {
      console.error(
        `Callback Error: No pending payment found for txnRef: ${txnRef}`
      );
      return NextResponse.json(
        { message: "Transaction reference not found or already processed." },
        { status: 200 }
      );
    }

    const pendingPayment = bnplPending;
    if (pendingPayment.status === "COMPLETED") {
      console.log("[PAYMENT_CALLBACK] duplicate callback ignored", {
        pendingPaymentId: pendingPayment.id,
      });
      return NextResponse.json(
        { message: "Payment already processed." },
        { status: 200 }
      );
    }

    const { loanId, amount: paymentAmount, borrowerId } = pendingPayment;

    const [loan, taxConfigs] = await Promise.all([
      prisma.loan.findUnique({
        where: { id: loanId },
        include: {
          product: {
            include: { provider: { include: { ledgerAccounts: true } } },
          },
          payments: { orderBy: { date: "asc" } },
        },
      }),
      prisma.tax.findMany({ where: { status: "ACTIVE" } }),
    ]);
    if (!loan) throw new Error(`Loan with ID ${loanId} not found.`);

    // Use getAsOfDate() for calculations to match UI display during testing
    const paymentDate = getAsOfDate();
    const alreadyRepaid = loan.repaidAmount || 0;

    // If this loan has an installment schedule, apply this payment to the active installment.
    // This is necessary for Salary Advance products where repayments are installment-based.
    const hasInstallments = await prisma.loanInstallment.count({
      where: { loanId },
    });

    const totals = calculateTotalRepayable(
      loan as any,
      loan.product as any,
      taxConfigs as any,
      paymentDate
    );
    const totalDue = totals.total - alreadyRepaid;

    if (!hasInstallments && paymentAmount > totalDue + 0.01) {
      // Add tolerance for floating point
      console.error(
        `[PAYMENT_CALLBACK_ERROR] Overpayment detected. Payment amount (${paymentAmount}) exceeds balance due (${totalDue}).`
      );
      // We still have to accept the callback, but we will not process the payment.
      // And we will flag the pending payment as failed.
      await prisma.pendingPayment.update({
        where: { transactionId: pendingPayment.transactionId },
        data: { status: "FAILED" },
      });
      return NextResponse.json(
        { message: "Overpayment detected, transaction will not be processed." },
        { status: 200 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // Claim this payment intent atomically. Under concurrent duplicate
      // callbacks both transactions reach this row; the second one blocks on
      // the row lock, then sees COMPLETED and applies nothing. If processing
      // below throws, the claim rolls back with the transaction.
      const claim = await tx.pendingPayment.updateMany({
        where: {
          transactionId: pendingPayment.transactionId,
          status: { not: "COMPLETED" },
        },
        data: { status: "COMPLETED" },
      });
      if (claim.count === 0) {
        console.log("[PAYMENT_CALLBACK] intent already claimed; skipping", {
          pendingPaymentId: pendingPayment.id,
        });
        return;
      }

      // Shared with the manual pending-payment approval so both entry points
      // move the same amounts through the same ledger accounts. Fees are
      // billed by entitlement and never re-billed on repeat payments (see
      // repayment-due.ts).
      const result = await applyBnplRepayment(tx, {
        loan: loan as any,
        taxConfigs: taxConfigs as any,
        paymentAmount,
        paymentDate,
        describeJournal: (installmentNumber) =>
          installmentNumber === null
            ? `SuperApp repayment for loan ${loan.id} via TxRef ${txnRef}`
            : `SuperApp repayment for installment ${installmentNumber} of loan ${loan.id} via TxRef ${txnRef}`,
        auditActorId: borrowerId,
        auditDetails: {
          transactionId: txnRef,
          paidBy: paidByNumber,
        },
        logLabel: "[PAYMENT_CALLBACK]",
      });

      // Nothing was applied — override the claim so the intent is not left
      // looking settled.
      if (result.outcome === "OVERPAYMENT") {
        await tx.pendingPayment.update({
          where: { transactionId: pendingPayment.transactionId },
          data: { status: "FAILED" },
        });
      }
    });

    // Stop CBS NPL monitoring once this borrower has nothing unpaid left.
    // Best-effort and self-gating: it no-ops while unpaid loans remain.
    void syncCbsDeletionForBorrower(borrowerId, { source: "MANUAL" });

    return NextResponse.json(
      { message: "Payment confirmed and updated." },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Callback Error: Failed to process payment update.", error);
    return NextResponse.json(
      {
        message:
          error.message || "Internal server error during payment processing.",
      },
      { status: 400 }
    );
  }
}
