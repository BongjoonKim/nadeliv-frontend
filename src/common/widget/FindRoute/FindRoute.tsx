import React, {useState, useEffect, MouseEvent} from 'react';
import {
  Box,
  Card,
  Text,
  HStack,
  VStack,
  Input,
  Button,
  IconButton,
  Tabs,
  Badge,
  Spinner,
  Grid,
  Separator
} from "@chakra-ui/react";
import {
  MapPin,
  Navigation,
  Route,
  Clock,
  Car,
  Train,
  Footprints,
  Search,
  Star,
  Bookmark,
  RotateCcw,
  Map as MapIcon,
  ChevronRight,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import CusButton from "../../elements/buttons/CusButton";
import CusIconButton from "../../elements/buttons/CusIconButton";
import MapInfo from "../maps/MapInfo";
import UnifiedMapSearch from "../maps/MapSearch/UnifiedMapSearch";
import { MapController, MapProvider } from "../../../types/maps/mapTypes";
import { UnifiedSearchResult } from "../maps/MapSearch/UnifiedMapSearch";
import {useCurrentUser} from "../../../hooks/useCurrentUser";
import NeedLogin from "../../../component/page/LoginPage/NeedLogin";
import {useNavigate} from "react-router-dom";
import {confirmDialog} from "../../elements/ConfirmDialog";

export interface FindRouteProps {
  mapProvider?: MapProvider;
}

interface SavedRoute {
  id: string;
  from: string;
  to: string;
  duration: string;
  distance: string;
  type: 'car' | 'transit' | 'walk';
  favorite?: boolean;
}

function FindRoute(props: FindRouteProps) {
  const { mapProvider = 'naver'} = props;
  
  const [mapController, setMapController] = useState<MapController | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 37.5665, lng: 126.9780 });
  const [mapZoom, setMapZoom] = useState(13);
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [fromPlace, setFromPlace] = useState<UnifiedSearchResult | null>(null);
  const [toPlace, setToPlace] = useState<UnifiedSearchResult | null>(null);
  const [routeType, setRouteType] = useState<'car' | 'transit' | 'walk'>('transit');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedTab, setSelectedTab] = useState(2);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [searchMode, setSearchMode] = useState<'from' | 'to' | null>(null);
  const currentUser = useCurrentUser();
  const navigate = useNavigate();
  const [savedRoutes] = useState<SavedRoute[]>([
    {
      id: '1',
      from: '명동역',
      to: '강남역',
      duration: '35분',
      distance: '12.5km',
      type: 'transit',
      favorite: true
    },
    {
      id: '2',
      from: '인천공항',
      to: '서울역',
      duration: '55분',
      distance: '62km',
      type: 'car',
      favorite: false
    },
    {
      id: '3',
      from: '호텔',
      to: '경복궁',
      duration: '20분',
      distance: '3.2km',
      type: 'walk',
      favorite: true
    }
  ]);
  
  const handleCardClick = (e : any) => {
    if ((e.target as HTMLElement).closest(".chakra-card__root"))
      setIsExpanded(!isExpanded);
  }
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };
  
  const handleSearch = async () => {
    if (!fromPlace || !toPlace) {
      alert('출발지와 도착지를 모두 선택해주세요.');
      return;
    }
    
    setIsSearching(true);
    try {
      // 경로 탐색 로직 구현
      if (mapController) {
        // 출발지와 도착지 마커 표시
        mapController?.clearMarkers?.();
        
        // 출발지 마커
        mapController.addMarker({
          position: fromPlace.position,
          title: fromPlace.name,
          icon: mapProvider === 'kakao'
            ? 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png'
            : undefined
        });
        
        // 도착지 마커
        mapController.addMarker({
          position: toPlace.position,
          title: toPlace.name
        });
        
        // 두 지점을 포함하는 영역으로 지도 조정
        mapController.fitBounds({
          sw: {
            lat: Math.min(fromPlace.position.lat, toPlace.position.lat),
            lng: Math.min(fromPlace.position.lng, toPlace.position.lng)
          },
          ne: {
            lat: Math.max(fromPlace.position.lat, toPlace.position.lat),
            lng: Math.max(fromPlace.position.lng, toPlace.position.lng)
          }
        });
        
        // 실제 경로 API 호출 (백엔드 구현 필요)
        console.log(`Searching route from ${fromPlace.name} to ${toPlace.name}`);
      }
      
      setTimeout(() => {
        setIsSearching(false);
      }, 1500);
    } catch (error) {
      console.error('Route search error:', error);
      setIsSearching(false);
    }
  };
  
  const swapLocations = () => {
    const tempLocation = fromLocation;
    const tempPlace = fromPlace;
    
    setFromLocation(toLocation);
    setFromPlace(toPlace);
    setToLocation(tempLocation);
    setToPlace(tempPlace);
  };
  
  const handlePlaceSelect = (place: UnifiedSearchResult) => {
    if (searchMode === 'from') {
      setFromLocation(place.name);
      setFromPlace(place);
      setSearchMode(null);
    } else if (searchMode === 'to') {
      setToLocation(place.name);
      setToPlace(place);
      setSearchMode(null);
    }
    
    // 지도 중심 이동
    if (mapController) {
      mapController.panTo(place.position);
      mapController.setZoom(15);
    }
  };
  
  const toggleFavorite = (id: string) => {
    console.log('Toggle favorite:', id);
  };
  
  const getRouteIcon = (type: 'car' | 'transit' | 'walk') => {
    switch(type) {
      case 'car': return <Car size={14} />;
      case 'transit': return <Train size={14} />;
      case 'walk': return <Footprints size={14} />;
      default: return <Route size={14} />;
    }
  };
  
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('이 브라우저는 위치 정보를 지원하지 않습니다.');
      return;
    }
    
    // 로딩 상태 표시 (선택적)
    const loadingToast = document.createElement('div');
    loadingToast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0,0,0,0.8);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      z-index: 10000;
      font-size: 14px;
    `;
    loadingToast.textContent = '현재 위치를 가져오는 중...';
    document.body.appendChild(loadingToast);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // 로딩 토스트 제거
        document.body.removeChild(loadingToast);
        
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        console.log('Current position:', { lat, lng });
        
        setMapCenter({ lat, lng });
        setMapZoom(15);
        
        if (mapController) {
          mapController.clearMarkers();
          mapController.addMarker({
            position: { lat, lng },
            title: '현재 위치',
            icon: mapProvider === 'kakao'
              ? 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png'
              : undefined
          });
        }
        
        setFromLocation('현재 위치');
        setFromPlace({
          id: 'current-location',
          name: '현재 위치',
          address: '현재 위치',
          position: { lat, lng },
          provider: mapProvider as 'kakao' | 'naver'
        });
      },
      async (error) => {
        // 로딩 토스트 제거
        if (document.body.contains(loadingToast)) {
          document.body.removeChild(loadingToast);
        }
        
        console.error('Geolocation error:', error);
        
        let errorMessage = '위치를 가져올 수 없습니다. ';
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += '위치 권한을 허용해주세요.\n\n' +
              '설정 방법:\n' +
              '1. 브라우저 주소창 왼쪽의 자물쇠 아이콘 클릭\n' +
              '2. 위치 권한을 "허용"으로 변경\n' +
              '3. 페이지 새로고침';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += '위치 정보를 사용할 수 없습니다.\n\n' +
              '다음을 확인해주세요:\n' +
              '• 기기의 위치 서비스가 켜져 있는지\n' +
              '• Wi-Fi나 모바일 데이터가 연결되어 있는지';
            
            // 대체 위치 제안 (서울 시청)
            const useDefaultLocation = await confirmDialog({
              title: '위치 정보를 사용할 수 없어요',
              description: errorMessage + '\n\n대신 서울 시청을 현재 위치로 사용할까요?',
              confirmText: '서울 시청 사용',
            });
            
            if (useDefaultLocation) {
              const defaultLat = 37.5665;
              const defaultLng = 126.9780;
              
              setMapCenter({ lat: defaultLat, lng: defaultLng });
              setMapZoom(15);
              
              if (mapController) {
                mapController.clearMarkers();
                mapController.addMarker({
                  position: { lat: defaultLat, lng: defaultLng },
                  title: '기본 위치 (서울 시청)',
                  icon: mapProvider === 'kakao'
                    ? 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png'
                    : undefined
                });
              }
              
              setFromLocation('서울 시청 (기본 위치)');
              setFromPlace({
                id: 'default-location',
                name: '서울 시청',
                address: '서울특별시 중구 세종대로 110',
                position: { lat: defaultLat, lng: defaultLng },
                provider: mapProvider as 'kakao' | 'naver'
              });
              return;
            }
            break;
          case error.TIMEOUT:
            errorMessage += '요청 시간이 초과되었습니다. 다시 시도해주세요.';
            break;
          default:
            errorMessage += '알 수 없는 오류가 발생했습니다.';
        }
        
        alert(errorMessage);
      },
      {
        enableHighAccuracy: true,  // 더 정확한 위치
        timeout: 10000,           // 10초 타임아웃
        maximumAge: 30000         // 30초까지 캐시된 위치 사용
      }
    );
  };
  
  return (
    <Card.Root
      bg="white"
      overflow="hidden"
      onClick={handleCardClick}
      css={{
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        cursor: "pointer",
        border: "1px solid #e5e7eb",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
        }
      }}
    >
      <Card.Body
        color="black"
        p={{ base: 3, md: 5 }}
        css={{
          flex : "direction,"
        }}
      >
        <VStack align="stretch" gap={4}>
          <HStack justify="space-between">
            <HStack gap={2}>
              <Box
                p={{ base: 2.5, md: 2 }}
                borderRadius="lg"
                css={{
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white"
                }}
              >
                <MapIcon size={24} />
              </Box>
              <Text fontSize={{ base: "md", md: "lg" }} fontWeight="semibold">
                Route Finder
              </Text>
            </HStack>
            <Box color="gray.400">
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </Box>
          </HStack>
            <Box onClick={(e : MouseEvent) => e.stopPropagation()}>
              {(!currentUser && isExpanded) ? (
                <>
                  {isExpanded ? (
                    <NeedLogin
                      feature="Route Finder"
                      onLoginClick={() => navigate('/login')}
                    />
                  ) : (<></>)}
                </>
                ) : (
                <Tabs.Root
                  value={selectedTab.toString()}
                  onValueChange={(e : { value: string }) => setSelectedTab(parseInt(e.value))}
                  onClick={() => setIsExpanded(true)}
                >
                  <Tabs.List
                    bg="gray.50"
                    borderRadius="xl"
                    p={1}
                    css={{
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    {/*<Tabs.Trigger value="0">경로 검색</Tabs.Trigger>*/}
                    {/*<Tabs.Trigger value="1">저장된 경로</Tabs.Trigger>*/}
                    <Tabs.Trigger
                      value="2"
                      css={{
                        color: "#6b7280",
                        borderRadius: "lg",
                        fontWeight: "500",
                        transition: "all 0.2s",
                        padding: "8px 16px",
                        fontSize: "14px",
                        "@media (max-width: 768px)": {
                          padding: "10px 20px",
                          fontSize: "15px",
                        },
                        "&[data-selected]": {
                          background: "white",
                          color: "#6366f1",
                          fontWeight: "600",
                          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)"
                        },
                        "&:hover:not([data-selected])": {
                          background: "#f9fafb"
                        }
                      }}
                    >
                      Korean Map
                    </Tabs.Trigger>
                  </Tabs.List>
                  
                  {isExpanded && (
                    <>
                      <Tabs.Content value="0">
                        <VStack gap={{ base: 4, md: 3 }} mt={3}>
                          {/* 이동 수단 선택 */}
                          <HStack w="full" justify="center" gap={{ base: 3, md: 2 }}>
                            <CusButton
                              size="sm"
                              leftIcon={<Train size={16} />}
                              variant={routeType === 'transit' ? 'solid' : 'outline'}
                              bg={routeType === 'transit' ? 'whiteAlpha.400' : 'transparent'}
                              borderColor="whiteAlpha.400"
                              color="black"
                              onClick={() => setRouteType('transit')}
                              _hover={{ bg: "whiteAlpha.300" }}
                            >
                              대중교통
                            </CusButton>
                            <CusButton
                              size="sm"
                              leftIcon={<Car size={16} />}
                              variant={routeType === 'car' ? 'solid' : 'outline'}
                              bg={routeType === 'car' ? 'whiteAlpha.400' : 'transparent'}
                              borderColor="whiteAlpha.400"
                              color="black"
                              onClick={() => setRouteType('car')}
                              _hover={{ bg: "whiteAlpha.300" }}
                            >
                              자동차
                            </CusButton>
                            <CusButton
                              size="sm"
                              leftIcon={<Footprints size={16} />}
                              variant={routeType === 'walk' ? 'solid' : 'outline'}
                              bg={routeType === 'walk' ? 'whiteAlpha.400' : 'transparent'}
                              borderColor="whiteAlpha.400"
                              color="black"
                              onClick={() => setRouteType('walk')}
                              _hover={{ bg: "whiteAlpha.300" }}
                            >
                              도보
                            </CusButton>
                          </HStack>
                          
                          {/* 위치 입력 */}
                          <VStack w="full" gap={2} position="relative">
                            <HStack w="full" gap={2}>
                              <Box flex={1} position="relative">
                                <Input
                                  value={fromLocation}
                                  onChange={(e) => setFromLocation(e.target.value)}
                                  placeholder="출발지"
                                  pl={10}
                                  bg="whiteAlpha.200"
                                  borderColor="whiteAlpha.400"
                                  color="black"
                                  readOnly
                                  cursor="pointer"
                                  onClick={() => {
                                    setSearchMode('from');
                                    setSelectedTab(3);
                                  }}
                                  _placeholder={{ color: "whiteAlpha.600" }}
                                  _hover={{ borderColor: "whiteAlpha.600" }}
                                  _focus={{ borderColor: "white", bg: "whiteAlpha.300" }}
                                />
                                <Box position="absolute" left={3} top="50%" transform="translateY(-50%)">
                                  <MapPin size={18} />
                                </Box>
                              </Box>
                              <CusIconButton
                                aria-label="현재 위치"
                                icon={<Navigation size={16} />}
                                size="sm"
                                variant="ghost"
                                color="black"
                                onClick={getCurrentLocation}
                                _hover={{ bg: "whiteAlpha.300" }}
                              />
                            </HStack>
                            
                            <CusIconButton
                              aria-label="위치 바꾸기"
                              icon={<RotateCcw size={16} />}
                              size="xs"
                              variant="ghost"
                              color="black"
                              position="absolute"
                              right={12}
                              top="50%"
                              transform="translateY(-50%)"
                              onClick={swapLocations}
                              _hover={{ bg: "whiteAlpha.300" }}
                              zIndex={2}
                            />
                            
                            <Box w="full" position="relative">
                              <Input
                                value={toLocation}
                                onChange={(e) => setToLocation(e.target.value)}
                                placeholder="도착지"
                                pl={10}
                                bg="whiteAlpha.200"
                                borderColor="whiteAlpha.400"
                                color="black"
                                readOnly
                                cursor="pointer"
                                onClick={() => {
                                  setSearchMode('to');
                                  setSelectedTab(3);
                                }}
                                _placeholder={{ color: "whiteAlpha.600" }}
                                _hover={{ borderColor: "whiteAlpha.600" }}
                                _focus={{ borderColor: "white", bg: "whiteAlpha.300" }}
                              />
                              <Box position="absolute" left={3} top="50%" transform="translateY(-50%)">
                                <Route size={18} />
                              </Box>
                            </Box>
                          </VStack>
                          
                          {/* 검색 버튼 */}
                          <CusButton
                            w="full"
                            leftIcon={<Search size={18} />}
                            onClick={handleSearch}
                            isLoading={isSearching}
                            loadingText="경로 검색 중..."
                            bg="whiteAlpha.300"
                            color="black"
                            _hover={{ bg: "whiteAlpha.400" }}
                          >
                            경로 찾기
                          </CusButton>
                        </VStack>
                      </Tabs.Content>
                      
                      {/*<Tabs.Content value="1">*/}
                      {/*  <VStack gap={2} mt={3} maxH="300px" overflowY="auto">*/}
                      {/*    {savedRoutes.map((route) => (*/}
                      {/*      <Box*/}
                      {/*        key={route.id}*/}
                      {/*        w="full"*/}
                      {/*        p={3}*/}
                      {/*        bg="whiteAlpha.200"*/}
                      {/*        borderRadius="lg"*/}
                      {/*        borderWidth="1px"*/}
                      {/*        borderColor="whiteAlpha.300"*/}
                      {/*        _hover={{ bg: "whiteAlpha.300" }}*/}
                      {/*        cursor="pointer"*/}
                      {/*        onClick={() => {*/}
                      {/*          setFromLocation(route.from);*/}
                      {/*          setToLocation(route.to);*/}
                      {/*          setRouteType(route.type);*/}
                      {/*          setSelectedTab(0);*/}
                      {/*        }}*/}
                      {/*      >*/}
                      {/*        <HStack justify="space-between">*/}
                      {/*          <VStack align="start" gap={1} flex={1}>*/}
                      {/*            <HStack>*/}
                      {/*              {getRouteIcon(route.type)}*/}
                      {/*              <Text fontWeight="semibold" fontSize="sm">*/}
                      {/*                {route.from}*/}
                      {/*              </Text>*/}
                      {/*            </HStack>*/}
                      {/*            <HStack fontSize="xs" opacity={0.9}>*/}
                      {/*              <ChevronRight size={12} />*/}
                      {/*              <Text>{route.to}</Text>*/}
                      {/*            </HStack>*/}
                      {/*            <HStack fontSize="xs" gap={3}>*/}
                      {/*              <HStack gap={1}>*/}
                      {/*                <Clock size={12} />*/}
                      {/*                <Text>{route.duration}</Text>*/}
                      {/*              </HStack>*/}
                      {/*              <Text>•</Text>*/}
                      {/*              <Text>{route.distance}</Text>*/}
                      {/*            </HStack>*/}
                      {/*          </VStack>*/}
                      {/*          <CusIconButton*/}
                      {/*            aria-label="즐겨찾기"*/}
                      {/*            icon={<Star size={16} fill={route.favorite ? 'white' : 'none'} />}*/}
                      {/*            size="sm"*/}
                      {/*            variant="ghost"*/}
                      {/*            color="black"*/}
                      {/*            onClick={(e) => {*/}
                      {/*              e.stopPropagation();*/}
                      {/*              toggleFavorite(route.id);*/}
                      {/*            }}*/}
                      {/*            _hover={{ bg: "whiteAlpha.400" }}*/}
                      {/*          />*/}
                      {/*        </HStack>*/}
                      {/*      </Box>*/}
                      {/*    ))}*/}
                      {/*  </VStack>*/}
                      {/*</Tabs.Content>*/}
                      
                      <Tabs.Content value="2">
                        <Box mt={3}>
                          <Box
                            w="full"
                            h={{ base: "520px", md: "600px" }}
                            borderRadius="lg"
                            overflow="hidden"
                            bg="gray.100"
                            position="relative"
                          >
                            <MapInfo
                              provider={mapProvider}
                              center={mapCenter}
                              zoom={mapZoom}
                              width="100%"
                              height="100%"
                              onMapLoad={(controller) => {
                                console.log('Map loaded with controller:', controller);
                                setMapController(controller);
                              }}
                            />
                          </Box>
                          
                          {/*<HStack mt={3} gap={2}>*/}
                          {/*  <CusButton*/}
                          {/*    size="sm"*/}
                          {/*    leftIcon={<Navigation size={14} />}*/}
                          {/*    flex={1}*/}
                          {/*    bg="whiteAlpha.300"*/}
                          {/*    color="black"*/}
                          {/*    onClick={getCurrentLocation}*/}
                          {/*    _hover={{ bg: "whiteAlpha.400" }}*/}
                          {/*  >*/}
                          {/*    내 위치*/}
                          {/*  </CusButton>*/}
                          {/*  <CusButton*/}
                          {/*    size="sm"*/}
                          {/*    leftIcon={<MapPin size={14} />}*/}
                          {/*    flex={1}*/}
                          {/*    bg="whiteAlpha.300"*/}
                          {/*    color="black"*/}
                          {/*    onClick={handleSearch}*/}
                          {/*    _hover={{ bg: "whiteAlpha.400" }}*/}
                          {/*  >*/}
                          {/*    경로 보기*/}
                          {/*  </CusButton>*/}
                          {/*</HStack>*/}
                        </Box>
                      </Tabs.Content>
                      
                      {/*<Tabs.Content value="3">*/}
                      {/*  <Box mt={3}>*/}
                      {/*    {searchMode && (*/}
                      {/*      <Box mb={2} p={2} bg="whiteAlpha.200" borderRadius="md">*/}
                      {/*        <Text fontSize="sm" color="black">*/}
                      {/*          {searchMode === 'from' ? '출발지' : '도착지'}를 선택해주세요*/}
                      {/*        </Text>*/}
                      {/*      </Box>*/}
                      {/*    )}*/}
                      {/*    */}
                      {/*    <UnifiedMapSearch*/}
                      {/*      mapController={mapController}*/}
                      {/*      mapProvider={mapProvider}*/}
                      {/*      onPlaceSelect={handlePlaceSelect}*/}
                      {/*      height="350px"*/}
                      {/*    />*/}
                      {/*  </Box>*/}
                      {/*</Tabs.Content>*/}
                    </>
                  )}
                </Tabs.Root>
              )}
              
            </Box>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}

export default FindRoute;