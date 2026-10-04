import { request } from "../appConfig/request-response";
import axios, { AxiosResponse } from "axios";
import { FuncProps } from "../utils/useAuthEP";
import {
  TravelResponse,
  TravelListResponse,
  TravelMedia,
  TravelMediaCountResponse,
  MediaUploadInitResponse,
} from "../types/travel/travelTypes";

// Travel CRUD
export async function createTravel(props: FuncProps) {
  return (await request.post("api/v1/travels", props.reqBody, {
    headers: {
      Authorization: `Bearer ${props.accessToken}`,
    },
  })) as AxiosResponse<TravelResponse>;
}

export async function getTravel(props: FuncProps) {
  return (await request.get(`api/v1/travels/${props.params.travelId}`, {
    headers: {
      Authorization: `Bearer ${props.accessToken}`,
    },
  })) as AxiosResponse<TravelResponse>;
}

export async function updateTravel(props: FuncProps) {
  return (await request.put(
    `api/v1/travels/${props.params.travelId}`,
    props.reqBody,
    {
      headers: {
        Authorization: `Bearer ${props.accessToken}`,
      },
    }
  )) as AxiosResponse<TravelResponse>;
}

export async function deleteTravel(props: FuncProps) {
  return (await request.delete(`api/v1/travels/${props.params.travelId}`, {
    headers: {
      Authorization: `Bearer ${props.accessToken}`,
    },
  })) as AxiosResponse<void>;
}

// Travel List
export async function getMyTravels(props: FuncProps) {
  return (await request.get(
    `api/v1/travels/my?page=${props.params?.page ?? 0}&size=${props.params?.size ?? 10}`,
    {
      headers: {
        Authorization: `Bearer ${props.accessToken}`,
      },
    }
  )) as AxiosResponse<TravelListResponse>;
}

export async function getPublicTravels(props: FuncProps) {
  return (await request.get(
    `api/v1/travels/public?page=${props.params?.page ?? 0}&size=${props.params?.size ?? 10}`
  )) as AxiosResponse<TravelListResponse>;
}

// Visited Regions (Korea Map)
export async function updateTravelRegions(props: FuncProps) {
  return (await request.put(
    `api/v1/travels/${props.params.travelId}/regions`,
    props.reqBody,
    {
      headers: {
        Authorization: `Bearer ${props.accessToken}`,
      },
    }
  )) as AxiosResponse<TravelResponse>;
}

// 다녀온 장소 목록 갱신 (전체 교체) — Korea Map 플러그인
export async function updateTravelPlaces(props: FuncProps) {
  return (await request.put(
    `api/v1/travels/${props.params.travelId}/places`,
    props.reqBody,
    {
      headers: {
        Authorization: `Bearer ${props.accessToken}`,
      },
    }
  )) as AxiosResponse<TravelResponse>;
}

// Member Management
export async function addTravelMember(props: FuncProps) {
  return (await request.post(
    `api/v1/travels/${props.params.travelId}/members`,
    props.reqBody,
    {
      headers: {
        Authorization: `Bearer ${props.accessToken}`,
      },
    }
  )) as AxiosResponse<TravelResponse>;
}

export async function removeTravelMember(props: FuncProps) {
  return (await request.delete(
    `api/v1/travels/${props.params.travelId}/members/${props.params.userId}`,
    {
      headers: {
        Authorization: `Bearer ${props.accessToken}`,
      },
    }
  )) as AxiosResponse<void>;
}

export async function updateMemberRole(props: FuncProps) {
  return (await request.put(
    `api/v1/travels/${props.params.travelId}/members/${props.params.userId}/role?role=${props.params.role}`,
    null,
    {
      headers: {
        Authorization: `Bearer ${props.accessToken}`,
      },
    }
  )) as AxiosResponse<TravelResponse>;
}

// Schedule Management
export async function addTravelSchedule(props: FuncProps) {
  return (await request.post(
    `api/v1/travels/${props.params.travelId}/schedules`,
    props.reqBody,
    {
      headers: {
        Authorization: `Bearer ${props.accessToken}`,
      },
    }
  )) as AxiosResponse<TravelResponse>;
}

export async function updateTravelSchedule(props: FuncProps) {
  return (await request.put(
    `api/v1/travels/${props.params.travelId}/schedules/${props.params.scheduleId}`,
    props.reqBody,
    {
      headers: {
        Authorization: `Bearer ${props.accessToken}`,
      },
    }
  )) as AxiosResponse<TravelResponse>;
}

export async function deleteTravelSchedule(props: FuncProps) {
  return (await request.delete(
    `api/v1/travels/${props.params.travelId}/schedules/${props.params.scheduleId}`,
    {
      headers: {
        Authorization: `Bearer ${props.accessToken}`,
      },
    }
  )) as AxiosResponse<TravelResponse>;
}

// Media Management
export async function getTravelMedia(props: FuncProps) {
  const query = new URLSearchParams({
    page: String(props.params?.page ?? 0),
    size: String(props.params?.size ?? 20),
  });
  if (props.params?.sort) query.set("sort", props.params.sort);
  if (props.params?.type && props.params.type !== "all") {
    query.set("type", props.params.type);
  }
  return (await request.get(
    `api/v1/travels/${props.params.travelId}/media?${query.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${props.accessToken}`,
      },
    }
  )) as AxiosResponse<TravelMedia[]>;
}

export async function getTravelMediaCount(props: FuncProps) {
  const query =
    props.params?.type && props.params.type !== "all"
      ? `?type=${props.params.type}`
      : "";
  return (await request.get(
    `api/v1/travels/${props.params.travelId}/media/count${query}`,
    {
      headers: {
        Authorization: `Bearer ${props.accessToken}`,
      },
    }
  )) as AxiosResponse<TravelMediaCountResponse>;
}

export async function deleteTravelMedia(props: FuncProps) {
  return (await request.delete(
    `api/v1/travels/${props.params.travelId}/media/${props.params.mediaId}`,
    {
      headers: {
        Authorization: `Bearer ${props.accessToken}`,
      },
    }
  )) as AxiosResponse<void>;
}

// Media Direct Upload (presigned) — 웹·iOS 공용 API
export async function initTravelMediaUpload(props: FuncProps) {
  return (await request.post(
    `api/v1/travels/${props.params.travelId}/media/uploads`,
    props.reqBody,
    {
      headers: {
        Authorization: `Bearer ${props.accessToken}`,
      },
    }
  )) as AxiosResponse<MediaUploadInitResponse>;
}

export async function refreshTravelMediaUploadParts(props: FuncProps) {
  return (await request.post(
    `api/v1/travels/${props.params.travelId}/media/uploads/${props.params.uploadId}/parts`,
    { partNumbers: props.params.partNumbers ?? [] },
    {
      headers: {
        Authorization: `Bearer ${props.accessToken}`,
      },
    }
  )) as AxiosResponse<MediaUploadInitResponse>;
}

export async function completeTravelMediaUpload(props: FuncProps) {
  return (await request.post(
    `api/v1/travels/${props.params.travelId}/media/uploads/${props.params.uploadId}/complete`,
    null,
    {
      headers: {
        Authorization: `Bearer ${props.accessToken}`,
      },
    }
  )) as AxiosResponse<TravelMedia>;
}

export async function abortTravelMediaUpload(props: FuncProps) {
  return (await request.delete(
    `api/v1/travels/${props.params.travelId}/media/uploads/${props.params.uploadId}`,
    {
      headers: {
        Authorization: `Bearer ${props.accessToken}`,
      },
    }
  )) as AxiosResponse<void>;
}

/**
 * presigned URL 로 S3 에 직접 PUT (인증 헤더·쿠키 없음).
 * SINGLE 은 서명된 Content-Type 을 그대로 보내야 하고, MULTIPART part 는 contentType 없이 보낸다.
 */
export async function putToPresignedUrl(params: {
  url: string;
  body: Blob;
  contentType?: string;
  onProgress?: (loadedBytes: number) => void;
  signal?: AbortSignal;
}) {
  return await axios.put(params.url, params.body, {
    headers: params.contentType ? { "Content-Type": params.contentType } : {},
    // 기본 transformRequest 가 Blob 을 건드리지 않도록 그대로 전달
    transformRequest: [(data) => data],
    onUploadProgress: (evt) => params.onProgress?.(evt.loaded),
    signal: params.signal,
  });
}

// Media Download
export async function downloadTravelMediaFile(props: FuncProps) {
  return (await request.get(
    `api/v1/travels/${props.params.travelId}/media/${props.params.mediaId}/download`,
    {
      headers: {
        Authorization: `Bearer ${props.accessToken}`,
      },
      responseType: "blob",
    }
  )) as AxiosResponse<Blob>;
}

export async function downloadTravelMediaBatch(props: FuncProps) {
  return (await request.post(
    `api/v1/travels/${props.params.travelId}/media/download`,
    props.reqBody,
    {
      headers: {
        Authorization: `Bearer ${props.accessToken}`,
      },
      responseType: "blob",
    }
  )) as AxiosResponse<Blob>;
}
