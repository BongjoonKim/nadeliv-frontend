import { request } from "../appConfig/request-response";
import { AxiosResponse } from "axios";
import { FuncProps } from "../utils/useAuthEP";
import {
  TravelResponse,
  TravelListResponse,
  TravelMedia,
  TravelMediaCountResponse,
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
export async function uploadTravelMedia(props: FuncProps) {
  const formData = new FormData();
  formData.append("file", props.params.file);
  if (props.reqBody) {
    formData.append(
      "request",
      new Blob([JSON.stringify(props.reqBody)], { type: "application/json" })
    );
  }
  return (await request.post(
    `api/v1/travels/${props.params.travelId}/media`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${props.accessToken}`,
        "Content-Type": "multipart/form-data",
      },
      // 업로드 진행률 (0~100). 호출처(useUploadTravelMedia)가 넘긴 콜백으로 전달
      onUploadProgress: (evt) => {
        if (!props.params.onProgress) return;
        const total = evt.total ?? props.params.file?.size ?? 0;
        if (total > 0) {
          props.params.onProgress(Math.min(100, Math.round((evt.loaded / total) * 100)));
        }
      },
      signal: props.params.signal,
    }
  )) as AxiosResponse<TravelMedia>;
}

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
