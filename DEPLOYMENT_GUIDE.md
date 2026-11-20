# 신짜오골프 배포 안내

## 배포 전

1. 프로젝트 전체를 Vercel에 연결한다.
2. 별도 설정 없이 `npm run build`와 `dist` 결과 폴더가 자동 적용된다.
3. 기준 주소는 `src/site-data.mjs`의 기본값 `https://xinchaogolf.com`(2026-11-20 이전)이다. 다른 주소로 바꿀 때만 Vercel 환경변수 `SITE_URL`에 `https://도메인` 형식으로 넣는다. 옛 주소 xinchao-golf.vercel.app은 빌드가 만드는 vercel.json 규칙으로 새 주소에 308 이동한다.
4. `npm run check`가 통과하지 않으면 배포하지 않는다.

## 공개 직후

1. PC와 실제 휴대전화에서 메인·골프장 상세·상담창을 확인한다.
2. 카카오톡 열기와 문의 내용 복사를 확인한다.
3. 기존 주소의 301 이동을 확인한다.
4. Google Search Console에서 소유권을 확인하고 `/sitemap.xml`을 제출한다.

홈페이지에서는 판매·결제·온라인 예약을 진행하지 않는다.
