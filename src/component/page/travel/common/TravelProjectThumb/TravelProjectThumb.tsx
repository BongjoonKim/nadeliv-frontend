import {useEffect, useState} from "react";
import styled from "styled-components";
import {homeTokens} from "../../../MainPage/MainBody/homeTokens";

export interface TravelProjectThumbProps {
  // 색 선택 기준 — 제목은 바뀔 수 있으니 프로젝트 id 를 넘긴다.
  seed: string;
  // 커버 사진 URL. 없거나 로드 실패 시 색 썸네일로 대체.
  src?: string;
  alt: string;
  className?: string;
}

// 같은 프로젝트는 어느 화면에서든 같은 색이 나오도록 id 를 해시해 팔레트 인덱스를 고른다.
export function getTravelProjectColor(seed: string): string {
  const palette = homeTokens.projectPalette;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return palette[Math.abs(hash) % palette.length];
}

// 부모 크기를 100% 채운다. 모양(원/둥근 사각)은 부모의 border-radius + overflow:hidden 으로.
function TravelProjectThumb({seed, src, alt, className}: TravelProjectThumbProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (src && !failed) {
    return (
      <ThumbImg
        className={className}
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <ThumbColor
      className={className}
      role="img"
      aria-label={alt}
      style={{background: getTravelProjectColor(seed)}}
    />
  );
}

export default TravelProjectThumb;

const ThumbImg = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const ThumbColor = styled.div`
  position: relative;
  width: 100%;
  height: 100%;

  /* 평면 색이 밋밋하지 않게 좌상단에 은은한 하이라이트 */
  &::after {
    content: "";
    position: absolute;
    inset: 0;
    background: radial-gradient(
      circle at 30% 25%,
      rgba(255, 255, 255, 0.18) 0%,
      rgba(255, 255, 255, 0) 60%
    );
  }
`;
