# 신짜오골프 홈페이지

호치민 골프 상담 유입을 중심으로 재구축한 정적 사이트입니다. 온라인 판매 기능은 없으며 모든 주요 버튼은 상담창으로 연결됩니다.

## 실행

```bash
npm run build
npm test
```

생성 결과는 `dist/`에 저장됩니다. 별도 패키지 설치 없이 Node.js만으로 빌드됩니다.

프리뷰 주소: https://xinchao-golf-renewal.kkacmn.chatgpt.site
프리뷰는 계정 로그인이 필요할 수 있습니다.

## 콘텐츠 수정

골프장·지역·서비스 정보는 `src/site-data.mjs`에서 관리합니다. 기존 블로그 원문은 `src/legacy-blog/`에 보존합니다. 새 블로그 글은 `src/content/blog/`에 마크다운으로 작성하면 목록·상세·SEO·사이트맵이 자동 생성됩니다. 자세한 방법은 `BLOG_WORKFLOW.md`를 확인합니다.
