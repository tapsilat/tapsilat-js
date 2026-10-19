/**
 * Request and response types for the panel REST API groups added for parity
 * with the other Tapsilat SDKs: order payments and charging, card installments,
 * organization currencies and users, submerchants, suborganizations, VPOS,
 * card tokenization and the version 2 marketplace API.
 *
 * Field names match the JSON wire format. Response fields are optional because
 * the server omits empty values.
 */

// ORDERS

/** Identifies an order by any one of its identifiers */
export interface OrderPaymentsRequest {
  order_id?: string;
  order_reference_id?: string;
  conversation_id?: string;
}

/** A payment made against an order */
export interface OrderPayment {
  id?: string;
  date?: string;
  payment_mode?: string;
  amount?: number;
  card_id?: string;
  masked_card?: string;
  card_holder_name?: string;
  card_type?: string;
  card_brand?: string;
  card_bank?: string;
  card_network?: string;
  paid?: boolean;
  type?: string;
  acquirer_response?: string;
  vpos_commission_amount?: number;
  vpos_commission_rate?: number;
  vpos_commission_fee_type?: string;
  organization_commission_amount?: number;
  organization_commission_rate?: number;
  organization_commission_fee_type?: string;
  total_amount?: number;
  acquirer_commission_amount?: number;
  acquirer_commission_rate?: number;
  acquirer_commission_fee_type?: string;
  acquirer_name?: string;
  customer_paid_commission_amount?: number;
  merchant_paid_commission_amount?: number;
  merchant_net_amount?: number;
}

/** Payments made against an order with their totals */
export interface OrderPaymentsResponse {
  payments?: OrderPayment[];
  total_amount?: number;
  total_customer_paid_commission_amount?: number;
  total_merchant_paid_commission_amount?: number;
  total_merchant_net_amount?: number;
  order_amount?: number;
}

/** Charges an order, for example with its saved card */
export interface OrderChargeRequest {
  order_reference_id: string;
  retry?: boolean;
}

/** Charge result; the server sends these keys in camelCase */
export interface OrderChargeResponse {
  isSuccess?: boolean;
  message?: string;
  statusCode?: string;
  errorCode?: string;
}

/** Submits or withdraws settlement approval for an item payment */
export interface SubmerchantPaymentAction {
  locale: string;
  conversation_id: string;
  payment_transaction_id: string;
  acquirer: string;
}

export interface SubmerchantPaymentActionResponse {
  operation_id?: string;
  status?: string;
  locale?: string;
  system_time?: number;
  conversation_id?: string;
  payment_transaction_id?: string;
  acquirer?: string;
}

/** Changes the seller or payout of a completed marketplace item */
export interface SubmerchantPaymentItemUpdate {
  locale: string;
  conversation_id: string;
  payment_transaction_id: string;
  sub_merchant_key: string;
  /** Positive decimal amount as a string, for example "60.25" */
  sub_merchant_price: string;
  acquirer: string;
}

export interface SubmerchantPaymentItemUpdateResponse {
  operation_id?: string;
  status?: string;
  locale?: string;
  system_time?: number;
  conversation_id?: string;
  payment_transaction_id?: string;
}

export interface OrderSubmerchantListItem {
  id?: string;
  name?: string;
  email?: string;
  submerchant_type?: string;
  submerchant_key?: string;
  labels?: string;
  status?: string;
  acquirer?: string;
}

/** Paginated submerchants of the organization's orders; rows are under `row` */
export interface OrderSubmerchantListResponse {
  page?: number;
  per_page?: number;
  total?: number;
  total_pages?: number;
  row?: OrderSubmerchantListItem[];
}

// CARD INSTALLMENTS

export interface CardInstallmentsRequest {
  /** The card's first digits (at least 8) */
  bin: string;
  amount: number;
  /** Currency unit or name, for example "TRY" */
  currency: string;
  is_three_d?: boolean;
}

export interface CardInstallment {
  installment?: number;
  amount?: string;
  total_amount?: string;
  commission_rate?: number;
  monthly_payment?: string;
}

export interface CardInstallmentsResponse {
  is_installment_available?: boolean;
  installments?: CardInstallment[];
}

export interface InstallmentTableRequest {
  amount: number;
  /** Currency unit or name, for example "TRY" */
  currency: string;
  is_three_d?: boolean;
}

export interface InstallmentTableRow {
  installment?: number;
  installment_amount?: string;
  total_amount?: string;
  commission_rate?: number;
  is_interest_free?: boolean;
}

export interface InstallmentTableGroup {
  bank?: string;
  program?: string;
  program_code?: string;
  rows?: InstallmentTableRow[];
}

export interface InstallmentTableResponse {
  groups?: InstallmentTableGroup[];
}

// ORGANIZATION

export interface OrganizationCurrency {
  id?: string;
  name?: string;
  code?: string;
  symbol?: string;
  currency_unit?: string;
}

export interface OrganizationCurrenciesResponse {
  currencies?: OrganizationCurrency[];
}

export interface OrganizationCurrencyPreset {
  currency_code?: string;
  currency_unit?: string;
  name?: string;
  minor_unit?: number;
}

export interface OrganizationCurrencyPresetsResponse {
  items?: OrganizationCurrencyPreset[];
}

export interface CreateOrganizationCurrencyResponse {
  code?: number;
  message?: string;
  created?: boolean;
  currency?: OrganizationCurrency;
}

/** Creates an access token for an organization user; `expire` is in minutes */
export interface OrgUserTokenCreateRequest {
  email?: string;
  expire?: number;
  invalidate_old_tokens?: boolean;
  user_id?: string;
}

export interface OrgUserTokenCreateResponse {
  code?: number;
  message?: string;
  token?: string;
  user_id?: string;
}

export interface OrgCreateUserResponse {
  code?: number;
  message?: string;
  user_id?: string;
}

// SUBMERCHANTS

/**
 * Creates or replaces a submerchant. `currency_id` accepts a currency UUID or
 * an organization currency unit such as "TRY".
 */
export interface SubmerchantCreateRequest {
  locale: string;
  conversation_id: string;
  name: string;
  email: string;
  gsm_number: string;
  address?: string;
  iban?: string;
  tax_office?: string;
  legal_company_title?: string;
  currency_id?: string;
  sub_merchant_external_id?: string;
  identity_number?: string;
  /** PERSONAL, PRIVATE_COMPANY or LIMITED_OR_JOINT_STOCK_COMPANY */
  sub_merchant_type?: string;
  tax_number?: string;
  sub_merchant_key?: string;
  organization_id?: string;
  status?: string;
  system_time?: number;
  contact_name?: string;
  contact_surname?: string;
}

/** Replaces the submerchant profile; send every field */
export type SubmerchantUpdateRequest = SubmerchantCreateRequest;

export interface Submerchant {
  id?: string;
  locale?: string;
  conversation_id?: string;
  name?: string;
  email?: string;
  gsm_number?: string;
  address?: string;
  iban?: string;
  tax_office?: string;
  legal_company_title?: string;
  currency_id?: string;
  sub_merchant_external_id?: string;
  identity_number?: string;
  sub_merchant_type?: string;
  tax_number?: string;
  sub_merchant_key?: string;
  organization_id?: string;
  labels?: string;
  status?: string;
  system_time?: number;
  acquirer?: string;
  contact_name?: string;
  contact_surname?: string;
}

export interface SubmerchantListItem {
  id?: string;
  name?: string;
  email?: string;
  submerchant_type?: string;
  submerchant_key?: string;
  labels?: string;
  status?: string;
  acquirer?: string;
}

/** Paginated submerchants; rows are under `row` */
export interface SubmerchantListResponse {
  page?: number;
  per_page?: number;
  total?: number;
  total_pages?: number;
  row?: SubmerchantListItem[];
}

/** Returned by submerchant create, update and delete */
export interface SubmerchantMutationResponse {
  code?: number;
  message?: string;
}

/** Selects a VPOS account in one environment for marketplace seller provisioning */
export interface MarketplaceAccountTarget {
  vpos_id: string;
  /** TEST or PROD */
  environment: string;
}

/**
 * Creates a marketplace seller. Omit both `vpos_id` and `provider_accounts` to
 * create only the logical seller; never combine them.
 */
export interface MarketplaceSubmerchantCreateRequest extends SubmerchantCreateRequest {
  provider_accounts?: MarketplaceAccountTarget[];
  labels?: string[];
  vpos_id?: string;
  /** auto or manual */
  approval_mode?: string | null;
  release_policy_id?: string | null;
  idempotency_key?: string;
}

export interface MarketplaceSubmerchantProvisioning {
  vpos_id?: string;
  vpos_submerchant_id?: string;
  provider?: string;
  status?: string;
  provider_submerchant_key?: string;
  retryable?: boolean;
  error_message?: string;
}

export interface MarketplaceSubmerchantCreateResponse {
  id?: string;
  suborganization_id?: string;
  vpos_submerchant_id?: string;
  routing_reference?: string;
  provisionings?: MarketplaceSubmerchantProvisioning[];
}

/** Records an item business event such as `service_completed` */
export interface SubmerchantPayoutEventRequest {
  idempotency_key: string;
  order_reference: string;
  item_id: string;
  event_type: string;
  /** RFC3339 timestamp */
  occurred_at?: string;
  payload?: Record<string, unknown>;
}

export interface SubmerchantPayoutEventResponse {
  id?: string;
  idempotency_key?: string;
  order_reference?: string;
  item_id?: string;
  event_type?: string;
  occurred_at?: string;
  payload?: Record<string, unknown>;
}

// SUBORGANIZATIONS

export interface SuborganizationListItem {
  id?: string;
  name?: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  currency?: string;
  logo?: string;
}

export interface SuborganizationListResponse {
  page?: number;
  per_page?: number;
  total?: number;
  total_pages?: number;
  rows?: SuborganizationListItem[];
}

export interface SuborganizationDetail {
  id?: string;
  name?: string;
  parent_id?: string;
  public_status?: number;
  availability_status?: number;
  created_at?: string;
  updated_at?: string;
}

export interface SubmerchantSuborganizationMapping {
  submerchant_id?: string;
  suborganization_id?: string;
}

export interface SuborganizationSubmerchantMapping {
  suborganization_id?: string;
  submerchant_id?: string;
}

// VPOS

/**
 * VPOS configuration. Updates replace the stored configuration, so fields
 * left out are stored as empty or false: read the VPOS first and send every
 * field back. `currencies` accepts currency UUIDs or units such as "TRY".
 */
export interface VposCreateRequest {
  name: string;
  bank_name?: string;
  env_mode?: string;
  merchant?: string;
  merchant_code?: string;
  merchant_key?: string;
  auth_key?: string;
  terminal?: string;
  company?: string;
  username?: string;
  password?: string;
  store_key?: string;
  api_key?: string;
  api_secret?: string;
  guid?: string;
  pid?: string;
  client_id?: string;
  client_code?: string;
  type?: string;
  block_date?: number;
  priority?: number;
  main?: boolean;
  force_three_d?: boolean;
  marketplace?: boolean;
  pf?: boolean;
  payment_mode?: string;
  prefix?: string;
  acquirer_id: string;
  card_schemes?: string[];
  currencies: string[];
  failover?: boolean;
  pf_id?: string;
  redirect_uri?: string;
  tls?: boolean;
  tls_key?: string;
  tls_cert?: string;
  root_ca?: string;
  main_installment?: boolean;
  main_without_installment?: boolean;
}

export type VposUpdateRequest = VposCreateRequest;

export interface Vpos extends Partial<VposCreateRequest> {
  id?: string;
  provider?: string;
}

export interface VposListItem {
  id?: string;
  name?: string;
  bank_name?: string;
  env_mode?: string;
  provider?: string;
  payment_mode?: string;
}

export interface VposListParams {
  page?: number;
  per_page?: number;
  suborganization_id?: string;
}

export interface VposListResponse {
  page?: number;
  per_page?: number;
  total?: number;
  total_pages?: number;
  rows?: VposListItem[];
}

export interface VposMutationResponse {
  code?: number;
  message?: string;
}

export interface VposAcquirer {
  id?: string;
  name?: string;
  prefix?: string;
}

export interface VposAcquirerListResponse {
  items?: VposAcquirer[];
}

export interface CardScheme {
  id?: string;
  name?: string;
}

export interface CardSchemeListResponse {
  items?: CardScheme[];
}

export interface VposAcquirerTemplateDefaults {
  payment_mode?: string;
  main?: boolean;
  marketplace?: boolean;
  force_three_d?: boolean;
  credentials?: Record<string, string>;
}

export interface VposAcquirerTemplate {
  acquirer_id?: string;
  name?: string;
  prefix?: string;
  required_fields?: string[];
  optional_fields?: string[];
  defaults?: VposAcquirerTemplateDefaults;
}

export interface VposAcquirerTemplateListResponse {
  items?: VposAcquirerTemplate[];
}

export interface VposSubmerchantCreateRequest {
  external_reference_id?: string;
  submerchant_id?: string;
  terminal_no?: string;
  vpos_id: string;
  mcc?: string;
  tax_id?: string;
  national_id?: string;
  title?: string;
  switch_id?: string;
  city?: string;
  country?: string;
  country_isocode?: string;
  postal_code?: string;
  address?: string;
  submerchant_url?: string;
  submerchant_nin?: string;
}

export interface VposSubmerchantUpdateRequest {
  external_reference_id?: string;
  submerchant_id?: string;
  terminal_no?: string;
  mcc?: string;
  tax_id?: string;
  national_id?: string;
  title?: string;
  switch_id?: string;
}

export interface VposSubmerchant {
  id?: string;
  external_reference_id?: string;
  submerchant_id?: string;
  terminal_no?: string;
  vpos_id?: string;
  mcc?: string;
  tax_id?: string;
  national_id?: string;
  title?: string;
  switch_id?: string;
}

export interface VposSubmerchantListItem {
  id?: string;
  external_reference_id?: string;
  submerchant_id?: string;
  terminal_no?: string;
  vpos_id?: string;
}

export interface VposSubmerchantListParams {
  page?: number;
  per_page?: number;
  vpos_id?: string;
  external_reference_id?: string;
}

export interface VposSubmerchantListResponse {
  page?: number;
  per_page?: number;
  total?: number;
  total_pages?: number;
  rows?: VposSubmerchantListItem[];
}

export interface VposSubmerchantMutationResponse {
  code?: number;
  message?: string;
}

// TOKENIZATION

export interface CardTokenizeRequest {
  card_number: string;
  holder_name: string;
  expiry_month: string;
  /** Two or four digits */
  expiry_year: string;
  cvv: string;
  name?: string;
  default?: boolean;
  /** 1 = 3D secure, 2 = half secure, 3 = non-secure */
  mode?: number;
  user_id?: string;
  user_email?: string;
  redirect_success_url?: string;
  redirect_failure_url?: string;
}

export interface CardTokenizeResponse {
  threedform_url?: string;
  threedform_html?: string;
  is_success?: boolean;
  message?: string;
  status_code?: string;
  error_code?: string;
  order_reference_id?: string;
  card_id?: string;
}

export interface SavedCard {
  id?: string;
  name?: string;
  holder_name?: string;
  masked_number?: string;
  last_four?: string;
  brand?: string;
  bin?: string;
  is_default?: boolean;
}

export interface ListSavedCardsResponse {
  page?: number;
  per_page?: number;
  total?: number;
  total_pages?: number;
  rows?: SavedCard[];
}

export interface DeleteSavedCardResponse {
  success?: boolean;
  message?: string;
}

// MARKETPLACE (API version 2)

export interface MarketplaceSeller {
  id?: string;
  routing_reference?: string;
  /** Opaque revision string; send it back unchanged */
  revision?: string;
  name?: string;
  email?: string;
  gsm_number?: string;
  address?: string;
  iban?: string;
  currency_id?: string;
  sub_merchant_type?: string;
  sub_merchant_external_id?: string;
  identity_number?: string;
  tax_number?: string;
  tax_office?: string;
  legal_company_title?: string;
  contact_name?: string;
  contact_surname?: string;
  locale?: string;
  conversation_id?: string;
  status?: string;
  labels?: string[];
  approval_mode?: string | null;
  release_policy_id?: string | null;
}

export interface MarketplaceSellerList {
  rows?: MarketplaceSeller[];
  page?: number;
  per_page?: number;
  total?: number;
  total_pages?: number;
}

export interface MarketplaceSellerListParams {
  page?: number;
  per_page?: number;
  /** Exact external ID match */
  external_id?: string;
}

/**
 * Replaces the seller profile at `revision` (from getMarketplaceSubmerchant).
 * Omit account selectors (`vpos_id`, `provider_accounts`).
 */
export interface MarketplaceProfileUpdate extends Omit<MarketplaceSubmerchantCreateRequest, "vpos_id" | "provider_accounts"> {
  /** Opaque revision string, sent back exactly as received */
  revision: string;
}

export interface MarketplaceProfileUpdateResponse {
  approval_required?: boolean;
}

export interface MarketplaceSellerContract {
  supported?: boolean;
  remote?: boolean;
  fields?: Record<string, boolean>;
  immutable_fields?: string[];
  currencies?: string[];
}

export interface MarketplaceContracts {
  contracts?: Record<string, MarketplaceSellerContract>;
}

export interface MarketplaceContractFilter {
  /** Currency UUID or unit such as "TRY" */
  currency_id: string;
  seller_type: string;
  operation: string;
  vpos_ids: string[];
}

export interface MarketplaceSynchronization {
  status?: string;
  operation?: string;
  error_message?: string;
  needs_update?: boolean;
  attempts?: number;
  verified_at?: string;
  missing_fields?: string[];
}

export interface MarketplaceSellerAccount {
  vpos_id?: string;
  name?: string;
  provider?: string;
  environment?: string;
  eligible?: boolean;
  mapped?: boolean;
  status?: string;
  attempts?: number;
  updated_at?: string;
  error_message?: string;
  retryable?: boolean;
  revision?: string;
  seller_revision?: string;
  account_revision?: string;
  actions?: string[];
  contracts?: Record<string, MarketplaceSellerContract>;
  contract_error?: string;
  sync?: MarketplaceSynchronization;
  registration_profile_changed?: boolean;
  registration_missing_fields?: string[];
  provider_submerchant_key?: string;
}

export interface MarketplaceSellerAccounts {
  rows?: MarketplaceSellerAccount[];
}

/** Confirms a listed account action using the account's latest revision and environment */
export interface MarketplaceAccountAction {
  /** create, retry, resubmit, update, retrieve or retry_sync */
  action: string;
  environment: string;
  revision: string;
}

export interface MarketplacePayout {
  /** Opaque revision string; send it back unchanged */
  revision?: string;
  active_operation_id?: string;
  id?: string;
  provider?: string;
  organization_id?: string;
  submerchant_id?: string;
  submerchant_name?: string;
  order_id?: string;
  order_reference_id?: string;
  order_display?: string;
  amount?: string;
  currency?: string;
  approval_mode?: string;
  approval_rule_id?: string;
  approval_rule_name?: string;
  release_policy_id?: string;
  release_policy_name?: string;
  eligibility_status?: string;
  required_event?: string;
  item_id?: string;
  business_eligible_at?: string;
  eligible_at?: string;
  release_status?: string;
  status?: string;
  provider_reference?: string;
  attempts?: number;
  released_at?: string;
  created_at?: string;
  error_message?: string;
}

export interface MarketplacePayoutFilter {
  order_id?: string;
  submerchant_id?: string;
  vpos_id?: string;
  provider?: string;
  status?: string;
  release_status?: string;
  approval_mode?: string;
  /** Currency unit such as "TRY" */
  currency?: string;
  eligibility?: string;
  search?: string;
  min_amount?: string;
  max_amount?: string;
  /** YYYY-MM-DD */
  start_date?: string;
  /** YYYY-MM-DD */
  end_date?: string;
  page?: number;
  per_page?: number;
}

export interface MarketplacePayoutList {
  rows?: MarketplacePayout[];
  page?: number;
  per_page?: number;
  total?: number;
  total_pages?: number;
}

export interface MarketplacePayoutApproval {
  /** At most 100 payout IDs */
  ids: string[];
}

export interface MarketplacePayoutAcceptance {
  status?: string;
}

export interface MarketplaceApprovalPolicy {
  id?: string;
  name?: string;
  priority?: number;
  enabled?: boolean;
  provider?: string;
  min_amount?: string | null;
  max_amount?: string | null;
  currency_id?: string | null;
  submerchant_ids?: string[];
  labels_any?: string[];
  mode?: string;
}

export interface MarketplaceApprovalPolicies {
  rows?: MarketplaceApprovalPolicy[];
}

/**
 * Creates or replaces an approval rule. `currency_id` must be a UUID on the
 * wire; the SDK resolves units such as "TRY" before sending.
 */
export interface MarketplaceApprovalPolicyInput {
  name: string;
  priority: number;
  enabled?: boolean | null;
  provider?: string;
  min_amount?: string | null;
  max_amount?: string | null;
  currency_id?: string;
  submerchant_ids?: string[];
  labels_any?: string[];
  mode: string;
}

export interface MarketplaceReleasePolicy {
  id?: string;
  name?: string;
  enabled?: boolean;
  default?: boolean;
  minimum_delay_seconds?: number;
  explicit_not_before?: string;
  required_external_event?: string;
}

export interface MarketplaceReleasePolicies {
  rows?: MarketplaceReleasePolicy[];
}

export interface MarketplaceReleasePolicyInput {
  name: string;
  enabled?: boolean;
  default?: boolean;
  minimum_delay_seconds?: number;
  explicit_not_before?: string;
  required_external_event?: string;
}

export interface MarketplaceApprovalSettings {
  /** auto or manual */
  default_mode?: string;
}

export interface MarketplacePayoutOperationInput {
  /** disapprove or update_item */
  kind: string;
  idempotency_key: string;
  /** The payout's current revision, sent back exactly as received */
  revision: string;
  seller_reference?: string;
  net_amount?: string;
}

export interface MarketplacePayoutOperation {
  id?: string;
  payout_id?: string;
  kind?: string;
  status?: string;
  attempts?: number;
  error_message?: string;
  created_at?: string;
  updated_at?: string;
}
