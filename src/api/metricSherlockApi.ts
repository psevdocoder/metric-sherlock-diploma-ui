import { apiRequest } from './http';
import type {
  DeleteMetricWhitelistRequest,
  DeleteTargetWhitelistRequest,
  GetMetricCheckLimitsResponse,
  GetScrapeTasksScheduleResponse,
  GetTargetGroupResponse,
  ListMetricWhitelistRequest,
  ListMetricWhitelistResponse,
  ListTargetGroupsRequest,
  ListTargetGroupsResponse,
  ListTargetWhitelistRequest,
  ListTargetWhitelistResponse,
  UpdateMetricCheckLimitsRequest,
  UpdateScrapeTasksScheduleRequest,
  UpsertMetricWhitelistRequest,
  UpsertTargetWhitelistRequest,
} from '../types/contracts';

export async function listTargetGroups(
  token: string | null,
  request: ListTargetGroupsRequest = {},
  signal?: AbortSignal,
) {
  return apiRequest<ListTargetGroupsResponse>('/api/v1/target-groups', {
    token,
    signal,
    query: request,
  });
}

export async function getTargetGroup(token: string | null, id: string, signal?: AbortSignal) {
  return apiRequest<GetTargetGroupResponse>(`/api/v1/target-groups/${encodeURIComponent(id)}`, {
    token,
    signal,
  });
}

export async function listMetricWhitelist(
  token: string | null,
  request: ListMetricWhitelistRequest = {},
  signal?: AbortSignal,
) {
  return apiRequest<ListMetricWhitelistResponse>('/api/v1/whitelist/metrics', {
    token,
    signal,
    query: request,
  });
}

export async function upsertMetricWhitelist(
  token: string | null,
  request: UpsertMetricWhitelistRequest,
) {
  return apiRequest<Record<string, never>>('/api/v1/whitelist/metrics', {
    method: 'PUT',
    token,
    body: request,
  });
}

export async function deleteMetricWhitelist(
  token: string | null,
  request: DeleteMetricWhitelistRequest,
) {
  const path = `/api/v1/whitelist/metrics/${encodeURIComponent(request.target_group)}/${encodeURIComponent(request.env)}/${encodeURIComponent(request.metric_name)}`;
  return apiRequest<Record<string, never>>(path, {
    method: 'DELETE',
    token,
  });
}

export async function listTargetWhitelist(
  token: string | null,
  request: ListTargetWhitelistRequest = {},
  signal?: AbortSignal,
) {
  return apiRequest<ListTargetWhitelistResponse>('/api/v1/whitelist/targets', {
    token,
    signal,
    query: request,
  });
}

export async function upsertTargetWhitelist(
  token: string | null,
  request: UpsertTargetWhitelistRequest,
) {
  return apiRequest<Record<string, never>>('/api/v1/whitelist/targets', {
    method: 'PUT',
    token,
    body: request,
  });
}

export async function deleteTargetWhitelist(
  token: string | null,
  request: DeleteTargetWhitelistRequest,
) {
  const path = `/api/v1/whitelist/targets/${encodeURIComponent(request.target_group)}/${encodeURIComponent(request.env)}`;
  return apiRequest<Record<string, never>>(path, {
    method: 'DELETE',
    token,
  });
}

export async function getMetricCheckLimits(token: string | null, signal?: AbortSignal) {
  return apiRequest<GetMetricCheckLimitsResponse>('/api/v1/settings/metric-check-limits', {
    token,
    signal,
  });
}

export async function updateMetricCheckLimits(
  token: string | null,
  request: UpdateMetricCheckLimitsRequest,
) {
  return apiRequest<Record<string, never>>('/api/v1/settings/metric-check-limits', {
    method: 'PUT',
    token,
    body: request,
  });
}

export async function getScrapeTasksSchedule(token: string | null, signal?: AbortSignal) {
  return apiRequest<GetScrapeTasksScheduleResponse>('/api/v1/settings/scrape-tasks-schedule', {
    token,
    signal,
  });
}

export async function updateScrapeTasksSchedule(
  token: string | null,
  request: UpdateScrapeTasksScheduleRequest,
) {
  return apiRequest<Record<string, never>>('/api/v1/settings/scrape-tasks-schedule', {
    method: 'PUT',
    token,
    body: request,
  });
}
