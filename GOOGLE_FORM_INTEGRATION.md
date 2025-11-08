<!-- 
Google Form 자동 제출 설정 가이드

Form URL: https://docs.google.com/forms/d/e/1FAIpQLSeSPD-TX4l-Um8RKzX6sETeoRhgSYxZcnzgFcA54nDCJoa3fw/viewform

Form ID 추출 필요:
1. 위 URL에서 /d/e/ 와 /viewform 사이의 ID 부분
2. Form의 실제 제출 endpoint 확인 필요

Google Form 필드 매핑:
- entry.xxxxx (이름)
- entry.xxxxx (연락처)
- entry.xxxxx (문의 유형)
- entry.xxxxx (통신사)
- entry.xxxxx (최근 개통일)
- entry.xxxxx (미납/연체 여부)
- entry.xxxxx (지역)
- entry.xxxxx (희망 진행 방식)
- entry.xxxxx (상세 내용)

각 질문의 entry ID는 Google Form 소스 보기에서 확인 가능
-->

Google Form Entry ID 확인 방법:

1. Form 열기: https://docs.google.com/forms/d/e/1FAIpQLSeSPD-TX4l-Um8RKzX6sETeoRhgSYxZcnzgFcA54nDCJoa3fw/viewform

2. 페이지에서 우클릭 → "페이지 소스 보기" (또는 F12 개발자 도구)

3. 검색 (Ctrl+F)로 "entry." 검색

4. 각 질문의 entry ID 찾기:
   - 이름 필드: entry.xxxxxxxxx
   - 연락처 필드: entry.xxxxxxxxx
   - 등등...

5. 찾은 entry ID들을 contact.html 스크립트에 매핑
