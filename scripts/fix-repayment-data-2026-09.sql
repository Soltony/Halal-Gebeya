/* ============================================================================
   REPAYMENT DATA FIX - halalBNPLDB (SQL Server), 2026-09
   Audited against a restored copy of production on 2026-09-24.

   Repairs the four Hello Beg loans damaged by the pre-fix repayment code:
     - every payment re-billed a service-fee share (serviceFee / N), so repeat
       payments on the same installment were booked as fee, never principal;
     - merged (rolled-over) installments lost their fee share;
     - the manual "mark successful" approval posted at loan level, ignoring
       installments and booking everything fee-first;
     - paid installments were relabelled 'MERGED' with their amount zeroed;
     - rounding dust (< 1 cent) kept installments open.

   The misbooked repayments are RESTATED in place (each original journal gets
   the principal / service-fee split it should have had), instead of posting
   correction journals today. Every report then shows the right figures on the
   original dates, and nothing is dated today. Totals per payment are unchanged.

   Per loan:
     ynvrs3tm  0.01 payment on 09-22 booked all fee
               -> restate as 0.0075 fee + 0.0025 principal, close, mark Paid
     tsvqnm91  5,360.44 manual repayment on 09-07 booked all principal
               -> restate as 4,873.1275 principal + 487.3125 fee, close, Paid
     ophzrzp0  6,335.08 payment on 09-23 re-billed a 487.3125 fee share, then
               a further 487.31 was paid (overpayment)
               -> restate 6,335.08 as all principal; remove the 487.31
                  overpayment from the books (the bank refunds it to the
                  borrower; an AuditLog row records it), close, mark Paid
     orzvoksy  4th fee share (423.75) never billed yet loan marked Paid
               -> restore installments, reopen so the app collects 423.75
                  as service fee (requires the 2026-09 code fix deployed)

   Also undoes the correction journals / refund payment written by the first
   version of this script (ids starting 'fix202609_'), if present.

   Safe to re-run: each step checks state first and is skipped once done.
   Any drift from the audited figures aborts the whole run.

   DRY RUN by default. Set @commit = 1 in the last batch to apply.
   ========================================================================== */
SET XACT_ABORT ON;
SET NOCOUNT ON;

IF OBJECT_ID('tempdb..#loans') IS NOT NULL DROP TABLE #loans;
CREATE TABLE #loans (
  loanId       NVARCHAR(450) PRIMARY KEY,
  tag          NVARCHAR(20)  NOT NULL,
  planAction   NVARCHAR(10)  NOT NULL,  -- CLOSE | REOPEN
  behavior     NVARCHAR(20)  NULL,      -- repaymentBehavior once closed
  expShortfall FLOAT         NULL       -- REOPEN: audited amount still owed
);
INSERT INTO #loans VALUES
  ('cmpmkwg09007m123nynvrs3tm', 'ynvrs3tm', 'CLOSE',  'EARLY',   NULL),
  ('cmpml4vnx009c123ntsvqnm91', 'tsvqnm91', 'CLOSE',  'EARLY',   NULL),
  ('cmpmllddi00a1123nophzrzp0', 'ophzrzp0', 'CLOSE',  'ON_TIME', NULL),
  ('cmpmm02mx00b6123norzvoksy', 'orzvoksy', 'REOPEN', NULL,      423.75);

-- Repayment journals to restate: move `amount` between principal and service
-- fee (P2F principal->fee, F2P fee->principal). prBefore/feeBefore are the
-- audited Received amounts of that journal before the restatement.
IF OBJECT_ID('tempdb..#restate') IS NOT NULL DROP TABLE #restate;
CREATE TABLE #restate (
  journalId NVARCHAR(450) PRIMARY KEY,
  loanId    NVARCHAR(450) NOT NULL,
  tag       NVARCHAR(20)  NOT NULL,
  dir       NVARCHAR(3)   NOT NULL,
  amount    FLOAT         NOT NULL,
  prBefore  FLOAT         NOT NULL,
  feeBefore FLOAT         NOT NULL
);
INSERT INTO #restate VALUES
  ('cmucgmgfz00ip2lmeomkxcnk4', 'cmpmkwg09007m123nynvrs3tm', 'ynvrs3tm', 'F2P', 0.0025,   0.0,       0.01),
  ('cmtr5bdnu007j2lmejf6p9gli', 'cmpml4vnx009c123ntsvqnm91', 'tsvqnm91', 'P2F', 487.3125, 5360.44,   0.0),
  ('cmue0dj9z00m02lmeqblitb3o', 'cmpmllddi00a1123nophzrzp0', 'ophzrzp0', 'F2P', 487.3125, 5847.7675, 487.3125);
GO

IF OBJECT_ID('tempdb..#fix_report') IS NOT NULL DROP PROCEDURE #fix_report;
GO
CREATE PROCEDURE #fix_report AS
BEGIN
  SET NOCOUNT ON;
  ;WITH led AS (
    SELECT je.loanId,
      SUM(CASE WHEN la.category = 'Principal'  AND la.type = 'Received'   THEN CASE le.type WHEN 'Debit' THEN le.amount ELSE -le.amount END ELSE 0 END) AS prRcvd,
      SUM(CASE WHEN la.category = 'ServiceFee' AND la.type = 'Received'   THEN CASE le.type WHEN 'Debit' THEN le.amount ELSE -le.amount END ELSE 0 END) AS feeRcvd,
      SUM(CASE WHEN la.category = 'Principal'  AND la.type = 'Receivable' THEN CASE le.type WHEN 'Debit' THEN le.amount ELSE -le.amount END ELSE 0 END) AS prOpen,
      SUM(CASE WHEN la.category = 'ServiceFee' AND la.type = 'Receivable' THEN CASE le.type WHEN 'Debit' THEN le.amount ELSE -le.amount END ELSE 0 END) AS feeOpen
    FROM LedgerEntry le
    JOIN JournalEntry je  ON je.id = le.journalEntryId
    JOIN LedgerAccount la ON la.id = le.ledgerAccountId
    WHERE je.loanId IN (SELECT loanId FROM #loans)
    GROUP BY je.loanId
  ), inst AS (
    SELECT loanId,
      SUM(amount) AS instAmt,
      SUM(CASE WHEN status NOT IN ('Paid', 'Merged') AND amount > 0 THEN 1 ELSE 0 END) AS openInst,
      SUM(CASE WHEN isActive = 1 THEN 1 ELSE 0 END) AS activeInst
    FROM LoanInstallment
    WHERE loanId IN (SELECT loanId FROM #loans)
    GROUP BY loanId
  ), pay AS (
    SELECT loanId, SUM(amount) AS paySum, SUM(CASE WHEN amount < 0 THEN 1 ELSE 0 END) AS negPayments
    FROM Payment WHERE loanId IN (SELECT loanId FROM #loans) GROUP BY loanId
  ), corr AS (
    SELECT loanId, COUNT(*) AS correctionJournals FROM JournalEntry
    WHERE id LIKE 'fix202609[_]%' GROUP BY loanId
  )
  SELECT x.tag, l.repaymentStatus AS status, l.repaymentBehavior AS behavior,
    ROUND(l.loanAmount + l.serviceFee, 4)                               AS owed,
    ROUND(COALESCE(l.repaidAmount, 0), 4)                               AS repaid,
    ROUND(COALESCE(l.repaidAmount, 0) - l.loanAmount - l.serviceFee, 4) AS repaidVsOwed,
    ROUND(p.paySum - COALESCE(l.repaidAmount, 0), 4)                    AS paymentsVsRepaid,
    ROUND(led.prRcvd - l.loanAmount, 4)                                 AS principalRcvdDiff,
    ROUND(led.feeRcvd - l.serviceFee, 4)                                AS feeRcvdDiff,
    ROUND(led.prOpen, 4)                                                AS principalOpen,
    ROUND(led.feeOpen, 4)                                               AS feeOpen,
    ROUND(i.instAmt - l.loanAmount, 4)                                  AS instSumVsPrincipal,
    i.openInst, i.activeInst,
    COALESCE(p.negPayments, 0)                                          AS negPayments,
    COALESCE(c.correctionJournals, 0)                                   AS correctionJournals
  FROM #loans x
  JOIN Loan l      ON l.id = x.loanId
  LEFT JOIN led    ON led.loanId = l.id
  LEFT JOIN inst i ON i.loanId = l.id
  LEFT JOIN pay p  ON p.loanId = l.id
  LEFT JOIN corr c ON c.loanId = l.id
  ORDER BY x.tag;
END
GO

-- Changes one ledger line of a journal by @delta (inserting or deleting the
-- line as needed) and moves the account balance with it. Balance convention
-- used by the app: Income accounts grow on Credit, all others on Debit.
IF OBJECT_ID('tempdb..#adjust_entry') IS NOT NULL DROP PROCEDURE #adjust_entry;
GO
CREATE PROCEDURE #adjust_entry
  @journalId NVARCHAR(1000), @accountId NVARCHAR(1000), @entryType NVARCHAR(10), @delta FLOAT
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @accType NVARCHAR(1000), @entryId NVARCHAR(1000), @amount FLOAT, @lines INT, @msg NVARCHAR(2048);

  SET @accType = (SELECT type FROM LedgerAccount WHERE id = @accountId);
  IF @accType IS NULL
    THROW 50010, 'adjust_entry: ledger account not found; aborting.', 1;

  SELECT @lines = COUNT(*), @entryId = MAX(id), @amount = MAX(amount)
  FROM LedgerEntry
  WHERE journalEntryId = @journalId AND ledgerAccountId = @accountId AND type = @entryType;

  IF @lines > 1
  BEGIN
    SET @msg = CONCAT('adjust_entry: journal ', @journalId, ' has several ', @entryType, ' lines on one account; aborting.');
    THROW 50011, @msg, 1;
  END

  IF @lines = 0
  BEGIN
    IF @delta < 0
    BEGIN
      SET @msg = CONCAT('adjust_entry: nothing to reduce in journal ', @journalId, '; aborting.');
      THROW 50012, @msg, 1;
    END
    INSERT INTO LedgerEntry (id, journalEntryId, ledgerAccountId, type, amount)
    VALUES (CONCAT('rst202609_', @journalId, '_', @accountId, '_', @entryType), @journalId, @accountId, @entryType, ROUND(@delta, 4));
  END
  ELSE IF @amount + @delta < -0.00005
  BEGIN
    SET @msg = CONCAT('adjust_entry: line in journal ', @journalId, ' would go negative; aborting.');
    THROW 50013, @msg, 1;
  END
  ELSE IF ABS(@amount + @delta) <= 0.00005
    DELETE FROM LedgerEntry WHERE id = @entryId;
  ELSE
    UPDATE LedgerEntry SET amount = ROUND(@amount + @delta, 4) WHERE id = @entryId;

  UPDATE LedgerAccount
  SET balance = balance + @delta * CASE
      WHEN (@accType = 'Income' AND @entryType = 'Credit') OR (@accType <> 'Income' AND @entryType = 'Debit') THEN 1
      ELSE -1 END
  WHERE id = @accountId;
END
GO

DECLARE @commit BIT = 0;   -- 0 = dry run (rolled back), 1 = apply

DECLARE @now DATETIME2 = SYSUTCDATETIME();
DECLARE @msg NVARCHAR(2048), @n INT;

PRINT '=== BEFORE ===';
EXEC #fix_report;

BEGIN TRAN;

/* ---------------------------------------------------------------------------
   0. Undo correction journals / refund payment written by the first version
      of this script. Restores the ledger and repaidAmount to what the app had
      booked; the restatement below then fixes the original journals.
--------------------------------------------------------------------------- */
UPDATE la SET balance = la.balance - d.delta
FROM LedgerAccount la
JOIN (
  SELECT le.ledgerAccountId,
         SUM(CASE WHEN (a.type = 'Income' AND le.type = 'Credit') OR (a.type <> 'Income' AND le.type = 'Debit')
                  THEN le.amount ELSE -le.amount END) AS delta
  FROM LedgerEntry le
  JOIN LedgerAccount a ON a.id = le.ledgerAccountId
  WHERE le.journalEntryId LIKE 'fix202609[_]%'
  GROUP BY le.ledgerAccountId
) d ON d.ledgerAccountId = la.id;

UPDATE l SET repaidAmount = l.repaidAmount - p.amt, updatedAt = @now
FROM Loan l
JOIN (SELECT loanId, SUM(amount) AS amt FROM Payment WHERE journalEntryId LIKE 'fix202609[_]%' GROUP BY loanId) p
  ON p.loanId = l.id;

DELETE FROM Payment WHERE journalEntryId LIKE 'fix202609[_]%';
DELETE FROM LedgerEntry WHERE journalEntryId LIKE 'fix202609[_]%';
DELETE FROM JournalEntry WHERE id LIKE 'fix202609[_]%';
SET @n = @@ROWCOUNT;
PRINT CONCAT('0. correction journals from the first version undone: ', @n);

/* ---------------------------------------------------------------------------
   1. Normalize legacy uppercase installment statuses. SQL Server compares
      case-insensitively, JavaScript does not.
--------------------------------------------------------------------------- */
UPDATE li SET status = 'Merged', updatedAt = @now
FROM LoanInstallment li JOIN #loans x ON x.loanId = li.loanId
WHERE li.status COLLATE Latin1_General_CS_AS = 'MERGED';
PRINT CONCAT('1a. MERGED -> Merged: ', @@ROWCOUNT);

UPDATE li SET status = 'Paid', updatedAt = @now
FROM LoanInstallment li JOIN #loans x ON x.loanId = li.loanId
WHERE li.status COLLATE Latin1_General_CS_AS = 'PAID';
PRINT CONCAT('1b. PAID -> Paid: ', @@ROWCOUNT);

/* ---------------------------------------------------------------------------
   2. Restore paid installments that the old rollover relabelled 'Merged' and
      zeroed. Their unpaid remainder already lives in the successor, so
      amount := paidAmount makes installment amounts sum to the principal.
--------------------------------------------------------------------------- */
UPDATE li SET amount = li.paidAmount, status = 'Paid', isActive = 0, updatedAt = @now
FROM LoanInstallment li JOIN #loans x ON x.loanId = li.loanId
WHERE li.status = 'Merged' AND COALESCE(li.paidAmount, 0) > 0.01 AND li.penaltyAmount = 0;
PRINT CONCAT('2. paid-but-merged installments restored: ', @@ROWCOUNT);

IF EXISTS (
  SELECT 1 FROM #loans x JOIN Loan l ON l.id = x.loanId
  WHERE ABS((SELECT SUM(amount) FROM LoanInstallment WHERE loanId = l.id) - l.loanAmount) > 0.01
)
  THROW 50001, '2. installment amounts do not sum to principal after restore; aborting.', 1;

/* ---------------------------------------------------------------------------
   3. Restate misbooked repayment journals with the split they should have had.
--------------------------------------------------------------------------- */
DECLARE @jid NVARCHAR(1000), @loanId NVARCHAR(1000), @tag NVARCHAR(20), @dir NVARCHAR(3), @amt FLOAT,
        @prBefore FLOAT, @feeBefore FLOAT, @prNow FLOAT, @feeNow FLOAT, @providerId NVARCHAR(1000),
        @prRecv NVARCHAR(1000), @prRcd NVARCHAR(1000), @feRecv NVARCHAR(1000), @feRcd NVARCHAR(1000), @feInc NVARCHAR(1000),
        @sign INT, @prDelta FLOAT, @feeDelta FLOAT;

DECLARE restate_cur CURSOR LOCAL FAST_FORWARD FOR
  SELECT journalId, loanId, tag, dir, amount, prBefore, feeBefore FROM #restate ORDER BY tag;
OPEN restate_cur;
FETCH NEXT FROM restate_cur INTO @jid, @loanId, @tag, @dir, @amt, @prBefore, @feeBefore;
WHILE @@FETCH_STATUS = 0
BEGIN
  SET @providerId = (SELECT providerId FROM JournalEntry WHERE id = @jid AND loanId = @loanId);
  IF @providerId IS NULL
  BEGIN
    SET @msg = CONCAT('3. ', @tag, ': journal ', @jid, ' not found for loan; aborting.');
    THROW 50020, @msg, 1;
  END

  SELECT
    @prNow  = COALESCE(SUM(CASE WHEN la.category = 'Principal'  AND la.type = 'Received' THEN CASE le.type WHEN 'Debit' THEN le.amount ELSE -le.amount END ELSE 0 END), 0),
    @feeNow = COALESCE(SUM(CASE WHEN la.category = 'ServiceFee' AND la.type = 'Received' THEN CASE le.type WHEN 'Debit' THEN le.amount ELSE -le.amount END ELSE 0 END), 0)
  FROM LedgerEntry le JOIN LedgerAccount la ON la.id = le.ledgerAccountId
  WHERE le.journalEntryId = @jid;

  -- P2F moves @amt from principal to fee; F2P the other way.
  SET @sign = IIF(@dir = 'P2F', 1, -1);

  IF ABS(@prNow - (@prBefore - @sign * @amt)) <= 0.00005 AND ABS(@feeNow - (@feeBefore + @sign * @amt)) <= 0.00005
    PRINT CONCAT('3. ', @tag, ': journal already restated - skipped');
  ELSE IF ABS(@prNow - @prBefore) > 0.00005 OR ABS(@feeNow - @feeBefore) > 0.00005
  BEGIN
    SET @msg = CONCAT('3. ', @tag, ': journal split drifted from audit (principal ', CONVERT(DECIMAL(18, 4), @prNow),
                      ', fee ', CONVERT(DECIMAL(18, 4), @feeNow), '); aborting.');
    THROW 50021, @msg, 1;
  END
  ELSE
  BEGIN
    SET @prRecv = (SELECT id FROM LedgerAccount WHERE providerId = @providerId AND category = 'Principal'  AND type = 'Receivable');
    SET @prRcd  = (SELECT id FROM LedgerAccount WHERE providerId = @providerId AND category = 'Principal'  AND type = 'Received');
    SET @feRecv = (SELECT id FROM LedgerAccount WHERE providerId = @providerId AND category = 'ServiceFee' AND type = 'Receivable');
    SET @feRcd  = (SELECT id FROM LedgerAccount WHERE providerId = @providerId AND category = 'ServiceFee' AND type = 'Received');
    SET @feInc  = (SELECT id FROM LedgerAccount WHERE providerId = @providerId AND category = 'ServiceFee' AND type = 'Income');
    IF @prRecv IS NULL OR @prRcd IS NULL OR @feRecv IS NULL OR @feRcd IS NULL OR @feInc IS NULL
      THROW 50022, '3. ledger accounts missing for provider; aborting.', 1;

    -- A repayment credits the receivable, debits received, and for fees
    -- also credits income.
    SET @prDelta = -@sign * @amt;
    SET @feeDelta = @sign * @amt;
    EXEC #adjust_entry @jid, @prRecv, 'Credit', @prDelta;
    EXEC #adjust_entry @jid, @prRcd,  'Debit',  @prDelta;
    EXEC #adjust_entry @jid, @feRecv, 'Credit', @feeDelta;
    EXEC #adjust_entry @jid, @feRcd,  'Debit',  @feeDelta;
    EXEC #adjust_entry @jid, @feInc,  'Credit', @feeDelta;

    PRINT CONCAT('3. ', @tag, ': restated ', @dir, ' ', CONVERT(DECIMAL(18, 4), @amt), ' in journal ', @jid);
  END

  FETCH NEXT FROM restate_cur INTO @jid, @loanId, @tag, @dir, @amt, @prBefore, @feeBefore;
END
CLOSE restate_cur; DEALLOCATE restate_cur;

/* ---------------------------------------------------------------------------
   4. Remove the ophzrzp0 overpayment from the books. The bank refunds the
      money to the borrower; the gateway intent stays COMPLETED so a replayed
      callback cannot book it again, and an AuditLog row records the removal.
--------------------------------------------------------------------------- */
DECLARE @refundLoan  NVARCHAR(1000) = 'cmpmllddi00a1123nophzrzp0';
DECLARE @refundTxRef NVARCHAR(100)  = '78beca63-a6ea-46f6-b385-7f17994a66df';
DECLARE @refundAudited FLOAT = 487.31;
DECLARE @payId NVARCHAR(1000), @payJe NVARCHAR(1000), @payAmt FLOAT, @payDate DATETIME2,
        @overpaid FLOAT, @jePr FLOAT, @jeFee FLOAT;

SELECT @payId = p.id, @payJe = p.journalEntryId, @payAmt = p.amount, @payDate = p.date
FROM Payment p JOIN JournalEntry je ON je.id = p.journalEntryId
WHERE p.loanId = @refundLoan AND je.description LIKE CONCAT('%', @refundTxRef, '%');

SELECT @overpaid = COALESCE(repaidAmount, 0) - loanAmount - serviceFee FROM Loan WHERE id = @refundLoan;

IF @payId IS NULL
BEGIN
  IF ABS(@overpaid) > 0.01
    THROW 50030, '4. overpayment record missing but loan is not settled exactly; aborting.', 1;
  PRINT '4. overpayment already removed - skipped';
END
ELSE
BEGIN
  SELECT
    @jePr  = COALESCE(SUM(CASE WHEN la.category = 'Principal'  AND la.type = 'Received' THEN CASE le.type WHEN 'Debit' THEN le.amount ELSE -le.amount END ELSE 0 END), 0),
    @jeFee = COALESCE(SUM(CASE WHEN la.category = 'ServiceFee' AND la.type = 'Received' THEN CASE le.type WHEN 'Debit' THEN le.amount ELSE -le.amount END ELSE 0 END), 0)
  FROM LedgerEntry le JOIN LedgerAccount la ON la.id = le.ledgerAccountId
  WHERE le.journalEntryId = @payJe;

  IF ABS(@payAmt - @refundAudited) > 0.001 OR ABS(@jeFee - @refundAudited) > 0.001 OR ABS(@jePr) > 0.00005
    THROW 50031, '4. overpayment record drifted from audit; aborting.', 1;
  IF ABS(@overpaid - @refundAudited) > 0.01
    THROW 50032, '4. loan is no longer overpaid by the audited amount; aborting.', 1;

  UPDATE la SET balance = la.balance - d.delta
  FROM LedgerAccount la
  JOIN (
    SELECT le.ledgerAccountId,
           SUM(CASE WHEN (a.type = 'Income' AND le.type = 'Credit') OR (a.type <> 'Income' AND le.type = 'Debit')
                    THEN le.amount ELSE -le.amount END) AS delta
    FROM LedgerEntry le JOIN LedgerAccount a ON a.id = le.ledgerAccountId
    WHERE le.journalEntryId = @payJe
    GROUP BY le.ledgerAccountId
  ) d ON d.ledgerAccountId = la.id;

  DELETE FROM Payment WHERE id = @payId;
  DELETE FROM LedgerEntry WHERE journalEntryId = @payJe;
  DELETE FROM JournalEntry WHERE id = @payJe;
  UPDATE Loan SET repaidAmount = repaidAmount - @payAmt, updatedAt = @now WHERE id = @refundLoan;

  INSERT INTO AuditLog (id, actorId, action, entity, entityId, details, createdAt)
  VALUES (CONCAT('fixaudit202609_refund_', @refundLoan), 'data-fix-2026-09', 'OVERPAYMENT_REMOVED_FOR_REFUND', 'LOAN', @refundLoan,
          CONCAT('{"txnRef":"', @refundTxRef, '","amount":', CONVERT(DECIMAL(18, 2), @payAmt),
                 ',"paymentId":"', @payId, '","journalEntryId":"', @payJe,
                 '","paymentDate":"', CONVERT(NVARCHAR(30), @payDate, 126),
                 '","note":"Overpayment removed from the books; to be refunded to the borrower by the bank."}'),
          @now);

  PRINT CONCAT('4. overpayment removed: ', CONVERT(DECIMAL(18, 2), @payAmt));
END

/* ---------------------------------------------------------------------------
   5. Close loans whose money and ledger now fully agree with what is owed.
--------------------------------------------------------------------------- */
DECLARE @behavior NVARCHAR(20), @status NVARCHAR(1000), @repaid FLOAT,
        @principal FLOAT, @fee FLOAT, @prRcvd FLOAT, @feeRcvd FLOAT;
DECLARE close_cur CURSOR LOCAL FAST_FORWARD FOR
  SELECT loanId, tag, behavior FROM #loans WHERE planAction = 'CLOSE' ORDER BY tag;
OPEN close_cur;
FETCH NEXT FROM close_cur INTO @loanId, @tag, @behavior;
WHILE @@FETCH_STATUS = 0
BEGIN
  SELECT @status = repaymentStatus, @repaid = COALESCE(repaidAmount, 0),
         @principal = loanAmount, @fee = serviceFee
  FROM Loan WHERE id = @loanId;

  SELECT
    @prRcvd  = COALESCE(SUM(CASE WHEN la.category = 'Principal'  AND la.type = 'Received' THEN CASE le.type WHEN 'Debit' THEN le.amount ELSE -le.amount END ELSE 0 END), 0),
    @feeRcvd = COALESCE(SUM(CASE WHEN la.category = 'ServiceFee' AND la.type = 'Received' THEN CASE le.type WHEN 'Debit' THEN le.amount ELSE -le.amount END ELSE 0 END), 0)
  FROM LedgerEntry le
  JOIN JournalEntry je  ON je.id = le.journalEntryId
  JOIN LedgerAccount la ON la.id = le.ledgerAccountId
  WHERE je.loanId = @loanId;

  IF ABS(@repaid - @principal - @fee) > 0.01 OR ABS(@prRcvd - @principal) > 0.00005 OR ABS(@feeRcvd - @fee) > 0.00005
  BEGIN
    SET @msg = CONCAT('5. ', @tag, ': money does not match what is owed (repaid ', CONVERT(DECIMAL(18, 4), @repaid),
                      ', principal rcvd ', CONVERT(DECIMAL(18, 4), @prRcvd), ', fee rcvd ', CONVERT(DECIMAL(18, 4), @feeRcvd), '); aborting.');
    THROW 50040, @msg, 1;
  END

  UPDATE LoanInstallment
  SET paidAmount = amount, status = 'Paid', isActive = 0, paidAt = COALESCE(paidAt, @now), updatedAt = @now
  WHERE loanId = @loanId AND status NOT IN ('Paid', 'Merged') AND amount > 0;
  PRINT CONCAT('5. ', @tag, ': open installments closed: ', @@ROWCOUNT);

  IF @status = 'Paid'
    PRINT CONCAT('5. ', @tag, ': already Paid - skipped');
  ELSE
  BEGIN
    UPDATE Loan SET repaymentStatus = 'Paid', repaymentBehavior = @behavior, updatedAt = @now WHERE id = @loanId;
    PRINT CONCAT('5. ', @tag, ': marked Paid (', @behavior, ')');
  END

  FETCH NEXT FROM close_cur INTO @loanId, @tag, @behavior;
END
CLOSE close_cur; DEALLOCATE close_cur;

/* ---------------------------------------------------------------------------
   6. Reopen under-collected loans so the app quotes the missing fee share.
      With every installment settled the app falls back to the loan-level
      balance (total repayable - repaid), i.e. exactly the shortfall.
--------------------------------------------------------------------------- */
DECLARE @shortfall FLOAT, @expShortfall FLOAT;
DECLARE reopen_cur CURSOR LOCAL FAST_FORWARD FOR
  SELECT loanId, tag, expShortfall FROM #loans WHERE planAction = 'REOPEN' ORDER BY tag;
OPEN reopen_cur;
FETCH NEXT FROM reopen_cur INTO @loanId, @tag, @expShortfall;
WHILE @@FETCH_STATUS = 0
BEGIN
  SELECT @status = repaymentStatus,
         @shortfall = loanAmount + serviceFee - COALESCE(repaidAmount, 0)
  FROM Loan WHERE id = @loanId;

  IF @status <> 'Paid' OR @shortfall <= 0.05
    PRINT CONCAT('6. ', @tag, ': not a Paid-but-short loan (', @status, ', shortfall ', CONVERT(DECIMAL(18, 2), @shortfall), ') - skipped');
  ELSE
  BEGIN
    IF ABS(@shortfall - @expShortfall) > 0.01
    BEGIN
      SET @msg = CONCAT('6. ', @tag, ': shortfall ', CONVERT(DECIMAL(18, 4), @shortfall), ' differs from audited ',
                        CONVERT(DECIMAL(18, 4), @expShortfall), '; aborting.');
      THROW 50050, @msg, 1;
    END
    IF EXISTS (SELECT 1 FROM LoanInstallment WHERE loanId = @loanId AND status NOT IN ('Paid', 'Merged') AND amount > 0)
    BEGIN
      SET @msg = CONCAT('6. ', @tag, ': has open installments; aborting.');
      THROW 50051, @msg, 1;
    END

    UPDATE LoanInstallment SET isActive = 0, updatedAt = @now WHERE loanId = @loanId AND isActive = 1;
    UPDATE Loan SET repaymentStatus = 'Unpaid', repaymentBehavior = NULL, updatedAt = @now WHERE id = @loanId;
    PRINT CONCAT('6. ', @tag, ': reopened to collect ', CONVERT(DECIMAL(18, 2), @shortfall));
  END

  FETCH NEXT FROM reopen_cur INTO @loanId, @tag, @expShortfall;
END
CLOSE reopen_cur; DEALLOCATE reopen_cur;

/* ---------------------------------------------------------------------------
   7. After-state and final checks
--------------------------------------------------------------------------- */
IF EXISTS (
  SELECT 1 FROM #loans x JOIN Loan l ON l.id = x.loanId
  WHERE ABS(COALESCE((SELECT SUM(amount) FROM Payment WHERE loanId = l.id), 0) - COALESCE(l.repaidAmount, 0)) > 0.001
     OR EXISTS (SELECT 1 FROM Payment WHERE loanId = l.id AND amount < 0)
)
  THROW 50060, '7. payments do not add up to repaidAmount; aborting.', 1;

PRINT '=== AFTER ===';
EXEC #fix_report;

PRINT '=== Ledger account balances vs their entries (expect empty) ===';
SELECT la.name, ROUND(la.balance, 4) AS balance, ROUND(x.fromEntries, 4) AS fromEntries
FROM LedgerAccount la
JOIN (
  SELECT le.ledgerAccountId,
         SUM(CASE WHEN (a.type = 'Income' AND le.type = 'Credit') OR (a.type <> 'Income' AND le.type = 'Debit')
                  THEN le.amount ELSE -le.amount END) AS fromEntries
  FROM LedgerEntry le JOIN LedgerAccount a ON a.id = le.ledgerAccountId
  GROUP BY le.ledgerAccountId
) x ON x.ledgerAccountId = la.id
WHERE ABS(la.balance - x.fromEntries) > 0.001;

IF @commit = 1
BEGIN
  COMMIT TRAN;
  PRINT '*** COMMITTED ***';
END
ELSE
BEGIN
  ROLLBACK TRAN;
  PRINT '*** DRY RUN - rolled back. Set @commit = 1 to apply. ***';
END
GO
