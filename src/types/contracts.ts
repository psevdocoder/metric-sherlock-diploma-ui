export type Int64Value = number | string;

export type TimestampValue =
  | string
  | null
  | {
      seconds?: number | string;
      nanos?: number;
    };

export interface ListTargetGroupsResponse {
  target_groups?: TargetGroupSummary[];
}

export interface GetTargetGroupResponse {
  target_group?: TargetGroupDetails;
}

export interface ListMetricWhitelistResponse {
  items?: MetricWhitelistItem[];
}

export interface ListTargetWhitelistResponse {
  items?: TargetWhitelistItem[];
}

export interface GetMetricCheckLimitsResponse {
  limits?: MetricCheckLimits;
}

export interface GetScrapeTasksScheduleResponse {
  cron_expr?: string;
}

export interface TargetGroupDetails {
  summary?: TargetGroupSummary;
  violations?: ViolationDetails;
  report_created_at?: TimestampValue;
}

export interface TargetGroupSummary {
  id?: Int64Value;
  name?: string;
  env?: string;
  cluster?: string;
  job?: string;
  team_name?: string;
  first_check?: TimestampValue;
  last_check?: TimestampValue;
  violation_stats?: ViolationStats;
}

export interface ViolationStats {
  total?: number;
  metric_name_too_long?: number;
  label_name_too_long?: number;
  label_value_too_long?: number;
  cardinality?: number;
  histogram_buckets?: number;
  response_weight?: Int64Value;
}

export interface ViolationDetails {
  metric_name_too_long?: MetricNameViolation[];
  label_name_too_long?: LabelNameViolation[];
  label_value_too_long?: LabelValueViolation[];
  cardinality?: CardinalityViolation[];
  histogram_buckets?: HistogramBucketsViolation[];
  max?: MaxViolationStats;
  response_weight?: Int64Value;
  checks?: CheckMetrics;
}

export interface CheckMetrics {
  metric_name_length?: CheckMetric;
  label_name_length?: CheckMetric;
  label_value_length?: CheckMetric;
  cardinality?: CheckMetric;
  histogram_buckets?: CheckMetric;
  response_weight?: CheckMetric;
}

export interface CheckMetric {
  limit?: Int64Value;
  current?: Int64Value;
}

export interface MaxViolationStats {
  metric_name_too_long?: MetricNameViolation;
  label_name_too_long?: LabelNameViolation;
  label_value_too_long?: LabelValueViolation;
  cardinality?: CardinalityViolation;
  histogram_buckets?: HistogramBucketsViolation;
}

export interface MetricNameViolation {
  metric_name?: string;
  length?: number;
}

export interface LabelNameViolation {
  metric_name?: string;
  label_name?: string;
  length?: number;
}

export interface LabelValueViolation {
  metric_name?: string;
  label_name?: string;
  value?: string;
  length?: number;
}

export interface CardinalityViolation {
  metric_name?: string;
  value?: number;
}

export interface HistogramBucketsViolation {
  metric_name?: string;
  buckets?: number;
}

export interface MetricWhitelistItem {
  target_group?: string;
  env?: string;
  metric_name?: string;
  checks?: MetricWhitelistChecks;
}

export interface MetricWhitelistChecks {
  metric_name_length?: Int64Value;
  label_name_length?: Int64Value;
  label_value_length?: Int64Value;
  cardinality?: Int64Value;
  histogram_buckets?: Int64Value;
}

export interface TargetWhitelistItem {
  target_group?: string;
  env?: string;
  checks?: TargetWhitelistChecks;
}

export interface TargetWhitelistChecks {
  metric_name_length?: boolean;
  label_name_length?: boolean;
  label_value_length?: boolean;
  cardinality?: boolean;
  histogram_buckets?: boolean;
  response_weight?: boolean;
}

export interface MetricCheckLimits {
  max_metric_name_len?: Int64Value;
  max_label_name_len?: Int64Value;
  max_label_value_len?: Int64Value;
  max_metric_cardinality?: Int64Value;
  max_histogram_buckets?: Int64Value;
  max_bytes_weight?: Int64Value;
}

export interface ListTargetGroupsRequest {
  team_name?: string;
}

export interface ListMetricWhitelistRequest {
  target_group?: string;
  env?: string;
}

export interface UpsertMetricWhitelistRequest {
  item: MetricWhitelistItem;
}

export interface DeleteMetricWhitelistRequest {
  target_group: string;
  env: string;
  metric_name: string;
}

export interface ListTargetWhitelistRequest {
  target_group?: string;
  env?: string;
}

export interface UpsertTargetWhitelistRequest {
  item: TargetWhitelistItem;
}

export interface DeleteTargetWhitelistRequest {
  target_group: string;
  env: string;
}

export interface UpdateMetricCheckLimitsRequest {
  limits: MetricCheckLimits;
}

export interface UpdateScrapeTasksScheduleRequest {
  cron_expr: string;
}
