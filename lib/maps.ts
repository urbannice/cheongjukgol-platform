// 별도의 유료 지도 API 없이, 지도 서비스의 "검색" 주소를 이용해
// 주소/장소명을 눌렀을 때 지도에서 위치를 확인할 수 있도록 합니다.
// 한국 사용자가 많은 점을 고려해 네이버 지도 검색을 기본으로 사용합니다.
export function buildMapSearchUrl(query: string) {
  return `https://map.naver.com/p/search/${encodeURIComponent(query)}`;
}
