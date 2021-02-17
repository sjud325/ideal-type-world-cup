# 구글 검색 이상형 월드컵

## 1. 프로젝트 주소
https://sjud325.asuscomm.com/ideal-type-world-cup/

## 2. 사용한 모듈 (Node.js)
* __Express__ : 웹 서버 구현을 위해 사용   
* __EJS__ : 서버 사이드 렌더링 시 데이터를 HTML에 담아서 전송하기 위해 사용   
* __Redis__ : 사용자별 세션을 저장하기 위해 사용   
* __Mongoose__ : 연예인 목록을 MongoDB에 저장하기 위해 사용   
* __Axios__ : 특정 연예인 이름으로 구글 이미지 검색 GET 통신을 하기 위해 사용
* __Webpack__ : 정적 파일에 Babel, Sass 등을 적용하기 위해 사용   

## 3. 프로젝트 기능 설명
+ __메인 페이지__
  + 남자 또는 여자 연예인 중 하나를 선택해서 플레이 가능
  + 성별이 변경될 시 라운드 진행을 위해 충분한 연예인이 등록되어 있는지 확인   
    (여자 이상형 월드컵 32강을 위해서는 여자 연예인이 최소 32명 등록되어 있어야 함)
  
  ![Desktop Index](/capture1.gif)

---------------------------------------

+ __연예인 목록 관리 페이지__
  + 연예인 이름을 추가하거나 제거할 수 있음
  + 성별을 구분하며 같은 이름의 연예인 등록 불가
  + 현재 추가/제거 상황을 좌상단에 실시간으로 표시
  
  ![Desktop Member](/capture2.gif)

---------------------------------------

+ __이상형 월드컵 페이지__
  + Back 단에서 "연예인 이름 고화질"로 구글 검색을 하여 나온 이미지 주소를 Front 단에 전달
  + 중앙에 있는 새로고침 버튼을 눌러 현재 연예인의 다른 사진을 볼 수 있음
  + 두 연예인 중 마음에 드는 연예인을 선택하여 다음 라운드로 진행
  + 사진 하나를 클릭하여 크게 볼 수 있음
  + 이미지 로드 시 403 또는 timeout 등의 이유로 오류가 나는 경우 다른 이미지를 선택하여 재시도
  + lottie 라이브러리 및 다양한 CSS transition 사용
  
  ![Desktop Choice 1](/capture3.gif)
  
  ![Desktop Choice 2](/capture4.gif)

---------------------------------------

+ __이상형 월드컵 결과 조회 페이지__
  + 세션에 저장된 결과를 이용해 결과 페이지 표시
  + D3 라이브러리를 이용해 현재까지의 대진표 출력   
    윈도우 크기가 변경되는 경우 (debounce 적용) 그래프를 다시 그림
  
  ![Desktop Winner](/capture5.gif)

---------------------------------------

+ __모바일 환경 지원__
  + 위 데스크탑 UI를 크기만 조절하여 모바일에 띄울 경우 가시성 대폭 하락
  + 가로 1280px 이상은 위 UI, 가로 720px 이하는 아래 UI로 표시되도록 CSS media query 적용
  
  ![Mobile Choice 1](/capture6.gif)
  
  ![Mobile Choice 2](/capture7.gif)
  
  ![Mobile Winner](/capture8.gif)
