/**
 * Interest Free Banking (IFB) display strings — UI copy only.
 * Business logic, APIs, and database identifiers are unchanged.
 */

export const IFB = {
  appTitle: 'Halal Gebeya',
  appDescription:
    'A mini-app for halal financing applications and Halal Gebeya processing.',

  financing: 'Financing',
  financingProduct: 'Financing product',
  financingProducts: 'Financing products',
  financingPartner: 'Financing partner',
  financingPartners: 'Financing partners',
  financingApplication: 'Financing application',
  financingRelease: 'Financing release',
  financingReleases: 'Financing releases',
  financingLimit: 'Financing limit',
  approvedFinancingLimit: 'Approved financing limit',
  availableFinancing: 'Available financing',
  financingAmount: 'Financing amount',
  financingHistory: 'Financing history',
  financingPool: 'Financing pool',

  customer: 'Customer',
  customers: 'Customers',
  customerProfile: 'Customer profile',

  agreement: 'Agreement',
  agreementNo: 'Agreement no.',
  agreementStatus: 'Agreement status',

  profitComponent: 'Profit component',
  profitMargin: 'Daily fee',
  administrationFee: 'Commission',
  lateCharge: 'Late settlement charge',
  outstandingFinancing: 'Outstanding financing',
  totalFinancingAmount: 'Total financing amount',

  settle: 'Settle',
  settlement: 'Settlement',
  settlements: 'Settlements',
  payment: 'Payment',
  payments: 'Payments',

  riskScoring: 'Risk scoring',
  riskScoringEngine: 'Risk scoring engine',
  financingEligibility: 'Financing eligibility',

  npf: 'NPF',
  npfCustomers: 'NPF customers',

  leviesTax: 'Levies & VAT',
  financingReleaseControl: 'Financing release control',

  pendingSettlements: 'Pending settlements',
  settlementApprovals: 'Settlement approvals',

  activeFinancing: 'Active financing',
  closedFinancing: 'Closed financing',

  shopIslamicBnpl: 'Shop — Halal BNPL',

  /** Phrases & longer UI copy */
  shariaTermsTitle: 'Sharia terms & conditions',
  shariaTermsIntro: (providerName: string) =>
    `Please read and accept the Sharia terms and conditions of ${providerName} to proceed.`,
  agreeShariaTerms: 'I have read and agree to the Sharia terms and conditions.',
  selectFinancingReleaseAccount: 'Select financing release account',
  financingReleaseAccountHelp:
    'Choose the account to receive financing releases for this facility. This selection is required.',
  paymentTowardsFinancing: (formattedAmount: string) =>
    `${formattedAmount} has been paid towards your financing.`,
  couldNotCalculateEligibility:
    'Could not calculate financing eligibility for this provider.',

  /** Status labels (display only; API may still send Paid / Unpaid / etc.) */
  statusSettled: 'Settled',
  statusActiveOutstanding: 'Active (outstanding)',
  statusPastDue: 'Past due',
  delinquencyRate: 'Delinquency rate',

  /** Admin dashboard ledger (UI labels only) */
  profitReceivable: 'Daily fee receivable',
  profitReceived: 'Daily fee received',
  administrationFeeReceivable: 'Commission receivable',
  administrationFeeReceived: 'Commission received',
  lateChargeReceivable: 'Late charge receivable',
  lateChargeReceived: 'Late charge received',
  financingAmountReceivable: 'Financing amount receivable',
  financingAmountReceived: 'Financing amount received',

  poolStartingCapital: 'Pool starting capital',
  poolStartingCapitalHint: 'Initial capital allocated to the financing pool',
  availablePoolBalance: 'Available pool balance',
  totalFinancingReleased: 'Total financing released',
  dailyFinancingReleased: 'Daily financing released',
  dailySettlements: 'Daily settlements',
  totalFinancingCount: 'Total financing facilities',
  uniqueCustomersWithFinancing: 'Unique customers with financing',
  financingReleasedOverTime: 'Financing released over time',
  financingStatusDistribution: 'Financing status distribution',
  financingStatusDistributionDesc: 'A breakdown of all facilities by their current status.',
  financingProductsOverview: 'Financing products overview',
  financingProductsOverviewDesc: 'A summary of all available financing products.',
  activeFinancingFacilities: 'Active facilities',

  /** Settings / product configuration (UI) */
  combinOtherFinancing: 'Combinable with other active financing',
  minFinancingAmountLabel: 'Min financing amount',
  maxFinancingAmountLabel: 'Max financing amount',
  financingDurationDaysLabel: 'Financing duration (days)',
  settlementIntervalLabel: 'Settlement interval',
  installmentsLabel: 'Installments',
  installmentsPlaceholder: 'e.g., 4 (leave empty for single settlement)',
  addNewFinancingProduct: 'Add new financing product',
  financingAmountTiers: 'Financing amount tiers',
  financingAmountTiersDesc:
    'Define financing limits by risk score bands for this product.',
  financingAmountTierColumn: 'Financing amount',
  lateChargeRules: 'Late charge rules',
  applyLateChargePerInstallment: 'Apply late charge per installment',
  addLateChargeRule: 'Add late charge rule',
  financingAmountBaseLabel: 'Financing amount',
  compoundBaseLabel: 'Compound (financing amount + accrued daily fee)',
  pctOfFinancingAmount: 'Percentage of financing amount',
  pctOfOutstanding: 'Percentage of outstanding balance',
  financingCycleTab: 'Financing cycle',
  financingCycleConfiguration: 'Financing cycle configuration',
  saveFinancingCycle: 'Save financing cycle',
  gradesAndPayouts: 'Grades & payout percentages',
  noProvidersForFinancingCycle: 'No financing partners available.',
  shariaTermsProductsPlaceholder:
    'Enter the Sharia terms and conditions for your financing products here.',
  externalRiskDataExample: 'e.g., External risk / bureau data',
  readOnlyEligibility: 'You only have read access for eligibility.',
  readOnlyProducts: 'You only have read access for products.',
  notAuthorizedFinancingCycle:
    'You are not authorized to update financing cycle configuration.',
  financingCycleSubmitted:
    'Financing cycle configuration has been submitted for approval.',
  failedFinancingCycleSubmit:
    'Failed to submit financing cycle configuration for approval',

  /** Error messages (must stay in sync with throw / catch checks) */
  errorInvalidFinancingAmount: 'Invalid financing amount',
  errorFinancingDurationPositive: 'Financing duration (days) must be greater than 0.',
  errorInstallmentsPositive: 'Installment count must be greater than 0.',
  errorInstallmentsVsDuration:
    'Installment count cannot be greater than duration (days).',

  /** Merchant / commerce labels */
  islamicBnplBadge: 'Halal BNPL',
  islamicBnplOnly: 'Halal BNPL only',
  islamicBnplAndDirect: 'Halal BNPL + direct',
  islamicBnplBothSelect: 'Both (Halal BNPL + direct)',
  branchEnableIslamicBnpl: 'Enable Halal BNPL (Interest Free pay-later)',
  branchEnableIslamicBnplHelp:
    'Allow this merchant to offer halal-style deferred payment at checkout',
  shopBrowseTagline: 'Browse items for halal BNPL or direct payment',

  /** Financing cycle metrics (settings UI) */
  metricTotalFinancingCount: 'Total financing count',
  metricOnTimeSettlements: 'On-time settlements',
  metricEarlySettlements: 'Early settlements',
  metricLateSettlements: 'Late settlements',
  productFeeConfiguration: 'Product fee & daily fee configuration',
  globalLeviesConfiguration: 'Global levies & VAT configuration',
  providersAndProducts: 'Partners & financing products',
  shariaTermsContentLabel: 'Sharia terms & conditions content',
  shariaTermsEmptyError: 'Sharia terms & conditions content cannot be empty.',
  customerAgreementTab: 'Customer agreement',

  /** Settings — tax tab & financing cycle form (read-only / misc) */
  taxSettingsReadOnlyDescription:
    'Read-only view of current system-wide levies & VAT settings.',
  vatRatePercentLabel: 'VAT rate (%)',
  leviesAppliedOnComponents: 'Levies / VAT applied on',
  editLeviesConfiguration: 'Edit configuration',
  saving: 'Saving…',
  productAndMetricRequired: 'Financing product and progression metric are required.',
  financingCycleConfigured: 'Configured',
  financingCycleNotConfigured: 'Not configured',
  progressionMetricLabel: 'Progression metric',
  selectProgressionMetricPlaceholder: 'Select metric',
  enabledLabel: 'Enabled',
  financingCycleRangesSection: 'Cycle ranges',
  financingCycleGradesSection: 'Grades & percentages',
  legacyCyclesLabel: 'Legacy cycles',
  financingCycleCardDescription:
    'Progression metric, cycle ranges, and grade percentages.',

  directOnly: 'Direct only',
  directPaymentOnly: 'Direct payment only',
  /** Order / queue display (payment channel) */
  directPayment: 'Direct payment',

  /** Merchant admin */
  islamicBnplEnabledField: 'Halal BNPL enabled',
  youHaveActiveFinancing: 'You have active financing',

  /** Add financing product dialog */
  submitProductForApproval: 'Submit for approval',
  everyNDays: (n: number) => `Every ${n} days`,

  /** Halal BNPL commerce orders (customer) */
  trackIslamicBnplOrdersSubtitle:
    'Track Halal BNPL order status and confirm delivery.',

  /** Admin — financing applications queue */
  financingApplicationsHeading: 'Financing applications',
  financingApplicationsIntro:
    'Review and process SME financing applications pending approval.',
  revisionNoteShownToCustomer: 'This will be shown to the customer.',

  /** Admin — reversals & reversal approvals (display copy) */
  financingIdLabel: 'Financing ID',
  customerAccountLabel: 'Customer account',
  customerIdLabel: 'Customer ID',
  reversalPostedFinancingSuffix: ' — Posted financing',
  reversalPostedFinancingShort: ' (Posted financing)',
  reversalFailedReleaseSuffix: ' — Failed financing release',
  reversalMarkAsSuccessPosted: 'posted financing',
  reversalMarkAsSuccessFailed: 'failed financing release',
  reversalReverseTargetPosted: 'posted financing',
  reversalReverseTargetFailed: 'failed financing release',
  reversalCancelApproveImpact:
    'Approving this will mark the financing release as successful, updating the transaction status and allowing normal facility processing to continue.',
  reversalReverseApproveImpact:
    'Approving this will reverse the financing facility, undoing journal entries and restoring the partner balance. The facility status will be set to REVERSED.',
  postedFinancingFieldLabel: 'Posted financing',
  financingReferenceDisplay: (id: string) => `Financing ${id}`,
  customerReferenceDisplay: (id: string) => `Customer ${id}`,

  /** Admin — reversals page (full copy) */
  reversalsPageTitle: 'Reversals',
  reversalsIntroPostedInternal: 'Financing posted internally without external financing release.',
  reversalsIntroAllReleases: 'All financing release transactions.',
  reversalsIntroFailedReleases:
    'Failed external financing releases that can be reversed internally.',
  reversalsFilterFailedOnly: 'Failed only',
  reversalsFilterPostedOnly: 'Posted only',
  reversalsFilterAllTransactions: 'All transactions',
  reversalsCardPostedNoRelease: 'Posted financing (no release record)',
  reversalsCardAllReleases: 'All financing releases',
  reversalsCardFailedReleases: 'Failed financing releases',
  reversalsCardDescPostedNoRelease:
    'These facilities were posted internally but have no external financing release transaction record.',
  reversalsCardDescAllReleases: 'View all financing release transactions regardless of status.',
  reversalsCardDescFailedReleases:
    'Submit a reversal request for approval to undo internal postings for failed upstream transfers.',
  reversalsEmptyPosted: 'No posted financing without release records found.',
  reversalsEmptyAll: 'No financing release transactions found.',
  reversalsEmptyFailed: 'No failed financing releases found.',
  reversalsTableFinancingIdShort: 'Financing',
  reversalsActionMarkSuccessful: 'Mark successful',
  cancelFailedFinancingReleaseTitle: 'Cancel failed financing release',
  cancelFailedFinancingReleaseBody:
    'Enter the CBS transaction ID to mark this financing release as successful. Use this when the external release actually succeeded but was recorded as failed.',

  /** Admin — financing applications */
  applicationApprovedFinancingReleased: (name: string) =>
    `Application for ${name} has been approved and financing released.`,
  applicationSentBackRevision: (name: string) =>
    `Application for ${name} has been sent back for revision.`,
  approveAutoReleaseFinancingWarning: (name: string) =>
    `You are about to approve and automatically release financing for ${name}. This action cannot be undone.`,

  /** Commerce / orders */
  orderDeliveredFinancingReleased:
    'Your order has been marked as delivered and financing has been released.',
  customerIdLabelUi: 'Customer',
  cancelOrderByCustomer: 'Cancelled by customer',
  orderCancelledNotifyCustomer: 'The customer will be notified that the order is cancelled.',
  searchMerchantOrdersPlaceholder: 'Search by order ID, customer ID, merchant, or item',
  itemDetailsShownInShop: 'Item details shown to customers in the shop.',

  /** Settings — customer agreement */
  shariaAgreementBeforeDeliveryNote:
    'This agreement will be shown to the customer before confirming delivery of an order.',

  /** Auth / connect */
  customerIdMissingFromSession: 'Customer ID not returned from session creation.',

  /** Admin dashboard recent activity label */
  customerReferenceShort: (idFragment: string) => `Customer #${idFragment}...`,

  /** Admin — data export */
  exportCustomerDataCardTitle: 'Export customer data',
  exportCustomerDataCardDescription:
    'Click the button below to download sample customer data as an Excel file.',
  exportCustomerDataFileExplainer:
    'This will generate an Excel (.xlsx) file containing the predefined list of customer profiles.',

  /** History */
  loadingFinancingDetails: 'Loading financing details…',

  /** SMS campaign UI */
  financingAgeDaysLabel: 'Financing age (days):',
  settlementStatusLabel: 'Settlement status:',
  allFacilitiesNoFilters: 'All facilities (no filters applied)',

  /** Admin — tax configuration */
  inclusiveTaxDeductFromFinancing: 'Inclusive tax (deduct from financing amount)',
  inclusiveTaxDeductFromFinancingHelp:
    'When enabled, the tax is deducted upfront from the financing amount before financing release.',
  taxAppliesToFinancingComponentsHelp:
    'Define universal tax rates and apply them to specific financing components.',

  /** Apply flow (toasts & dialogs) */
  eligibleForFinancing: 'You are eligible for financing.',
  orderPlacedFinancingAfterDelivery:
    'Your order has been placed. Financing will be released once you confirm delivery.',
  saveFinancingFailed: 'Failed to save the financing.',
  financingSavedSuccess: 'Your financing has been saved.',
  upstreamFinancingReleaseFailed: 'Upstream financing release failed',
  externalFinancingReleaseSent: 'External financing release request was sent.',
  noFinancingReleaseAccountSelected:
    'No financing release account was selected; external transfer was not attempted.',

  /** Apply — provider missing */
  noDocumentsRequiredForProduct: 'No documents are required for this financing product.',
  financingPartnerNotFoundTitle: 'Financing partner not found',
  financingPartnerNotFoundShort:
    'The financing partner you selected could not be found. It may no longer be available.',

  /** Admin — pending settlements list */
  pendingSettlementsCardTitle: 'Pending settlements',
  pendingSettlementsCardDescription:
    'Settlements awaiting confirmation from the payment gateway. Mark as successful when you have the CBS FT reference.',

  /** NPF admin toasts */
  npfUpdateCustomersCount: (n: number) => `${n} customer(s) have been updated.`,

  /** Admin — reports (restricted + export + table labels) */
  reportsRestrictedNoPartner:
    'You are not currently associated with a financing partner. Please contact an administrator to get access to reports.',
  excelSheetPartnerFinancing: 'Partner financing',
  excelSheetFinancingReleases: 'Financing releases',
  excelSheetSettlements: 'Settlements',
  excelSheetCustomerAging: 'Customer aging',
  excelSheetCustomerPerformance: 'Customer performance',
  excelColCustomer: 'Customer',
  excelColFinancingFacilitiesReleased: 'Financing facilities released',
  excelColOutstandingFinancingAmt: 'Outstanding financing',
  excelColMurabahaProfitOutstanding: 'Outstanding daily fee',
  disbursementColFinancingAmountMls: 'Financing amount (MLS)',
  disbursementColMurabahaProfitMls: 'Daily fee (MLS)',
  disbursementColNetReleasedMls: 'Net released (MLS)',

  /** Reversal approvals list */
  reversalApprovalsPageTitle: 'Reversal approvals',
  reversalApprovalsCardTitle: 'Reversal & cancel requests',
  reversalApprovalsCardDescription:
    'Review and approve or reject pending financing release reversals and cancel requests.',

  /** Customer-facing SMS (financing release) */
  smsIslamicBnplReleasedToMerchant: (amt: string) =>
    `Your Halal BNPL financing of ETB ${amt} has been successfully released to the merchant. Thank you for choosing Halal Gebeya.`,
  smsFinancingReleasedToAccount: (amt: string, account: string) =>
    `Your financing request of ETB ${amt} has been successfully released to your account ${account}. Thank you for choosing Halal Gebeya.`,
  smsFinancingReleaseFailed: (amt: string) =>
    `Your financing request of ETB ${amt} could not be processed. Please try again later or contact Halal Gebeya support for assistance.`,

  /** Admin onboarding / credentials SMS */
  smsWelcomeMerchantAccount: (appUrl: string, email: string, password: string) =>
    `Welcome to Halal Gebeya. Your merchant account has been created.\nLogin: ${appUrl}/admin/login\nEmail: ${email}\nPassword: ${password}\nPlease change your password on first login.`,
  smsAccountCredentialsReminder: (appUrl: string, email: string) =>
    `Halal Gebeya: Your account credentials.\nLogin: ${appUrl}/admin/login\nEmail: ${email}\nPlease use your existing password or contact admin if you forgot it.`,
  smsPasswordResetNotice: (appUrl: string, email: string, newPassword: string) =>
    `Halal Gebeya: Your password has been reset.\nLogin: ${appUrl}/admin/login\nEmail: ${email}\nNew Password: ${newPassword}\nPlease change your password on first login.`,
  smsWelcomeUserAccount: (appUrl: string, email: string, rawPassword: string) =>
    `Welcome to Halal Gebeya. Your account has been created.\nLogin: ${appUrl}/admin/login\nEmail: ${email}\nPassword: ${rawPassword}\nPlease change your password on first login.`,
  smsWelcomeUserAccountWithPassword: (appUrl: string, email: string, newPassword: string) =>
    `Welcome to Halal Gebeya. Your account has been created.\nLogin: ${appUrl}/admin/login\nEmail: ${email}\nPassword: ${newPassword}\nPlease change your password on first login.`,
  smsPasswordResetShort: (appUrl: string, email: string, newPassword: string) =>
    `Your Halal Gebeya password has been reset.\nLogin: ${appUrl}/admin/login\nEmail: ${email}\nNew Password: ${newPassword}\nPlease change your password on first login.`,

  /** Eligibility / validation (shown to customers & admins) */
  customerProfileNotFound: 'Customer profile not found.',
  customerRestrictedNpf: 'Customer account is restricted due to non-performing financing (NPF) status.',
  customerHasActiveUnpaidFinancing: 'Customer already has active outstanding financing.',
  customerHasActiveIslamicBnplOrder: 'Customer already has an active Halal BNPL order in progress.',
  customerPendingFinancingRelease: 'Customer has a pending financing release transaction.',
  customerActiveFinancingApplication: 'Customer already has a financing application in progress.',
  selectCustomerProfile: 'Select a customer profile',

  /** Scoring engine behavioral parameter labels */
  paramTotalFinancingCount: 'Total financing count',
  paramFinancingOnTime: 'Financing settled on time',
  paramFinancingLate: 'Financing settled late',
  paramFinancingEarly: 'Financing settled early',

  /** USSD / channel transaction labels */
  ussdFinancingReleaseForProduct: (productName: string) =>
    `Financing release for ${productName}`,
  ussdSettlement: 'Settlement',
  ussdBorrowerIdRequired: 'Customer ID is required.',
  ussdCustomerNotFound: 'Customer not found.',
  ussdFinancingPartnerNotFound: 'Financing partner not found.',
  ussdCustomerAndPartnerRequired: 'Customer ID and financing partner ID are required.',
  reversalRejectPlaceholderFailedRelease: 'e.g., Not a valid failed financing release…',
  reversalRejectPlaceholderReleaseSucceeded:
    'e.g., The financing release was actually successful, no reversal needed…',
} as const;

