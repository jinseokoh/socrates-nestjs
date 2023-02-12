export enum Region {
  ROOT = 'ROOT', // AS OPPOSED TO CONTACTLESS

  KOREA = 'KOREA',
  JAPAN = 'JAPAN',
  TAIWAN = 'TAIWAN',
  PHILIPPINES = 'PHILIPPINES',
  MALAYSIA = 'MALAYSIA',
  SINGAPORE = 'SINGAPORE',
  THAILAND = 'THAILAND',
  VIETNAM = 'VIETNAM',
  HONGKONG = 'HONGKONG',
  CHINA = 'CHINA',
  GUAM = 'GUAM',
  SAIPAN = 'SAIPAN',
  CANADA = 'CANADA',
  AMERICA = 'AMERICA',
  OTHER = 'OTHER',

  SEOUL = 'SEOUL',
  BUSAN = 'BUSAN',
  INCHEON = 'INCHEON',
  ULSAN = 'ULSAN',
  DAEJEON = 'DAEJEON',
  DAEGU = 'DAEGU',
  GWANGJU = 'GWANGJU',
  SEJONG = 'SEJONG',
  GYEONGGI = 'GYEONGGI',
  GANGWON = 'GANGWON',
  NORTHERN_JEOLLA = 'NORTHERN_JEOLLA',
  SOUTHERN_JEOLLA = 'SOUTHERN_JEOLLA',
  NORTHERN_GYEONGSANG = 'NORTHERN_GYEONGSANG',
  SOUTHERN_GYEONGSANG = 'SOUTHERN_GYEONGSANG',
  NORTHERN_CHUNGCHEONG = 'NORTHERN_CHUNGCHEONG',
  SOUTHERN_CHUNGCHEONG = 'SOUTHERN_CHUNGCHEONG',
  JEJU = 'JEJU',

  SEOUL_GANGNAM_GU = 'SEOUL_GANGNAM_GU',
  SEOUL_GANGDONG_GU = 'SEOUL_GANGDONG_GU',
  SEOUL_GANGBUK_GU = 'SEOUL_GANGBUK_GU',
  SEOUL_GANGSEO_GU = 'SEOUL_GANGSEO_GU',
  SEOUL_GWANAK_GU = 'SEOUL_GWANAK_GU',
  SEOUL_GWANGJIN_GU = 'SEOUL_GWANGJIN_GU',
  SEOUL_GURO_GU = 'SEOUL_GURO_GU',
  SEOUL_GEUMCHEON_GU = 'SEOUL_GEUMCHEON_GU',
  SEOUL_NOWON_GU = 'SEOUL_NOWON_GU',
  SEOUL_DOBONG_GU = 'SEOUL_DOBONG_GU',
  SEOUL_DONGDAEMUN_GU = 'SEOUL_DONGDAEMUN_GU',
  SEOUL_DONGJAK_GU = 'SEOUL_DONGJAK_GU',
  SEOUL_MAPO_GU = 'SEOUL_MAPO_GU',
  SEOUL_SEODAEMUN_GU = 'SEOUL_SEODAEMUN_GU',
  SEOUL_SEOCHO_GU = 'SEOUL_SEOCHO_GU',
  SEOUL_SEONGDONG_GU = 'SEOUL_SEONGDONG_GU',
  SEOUL_SEONGBUK_GU = 'SEOUL_SEONGBUK_GU',
  SEOUL_SONGPA_GU = 'SEOUL_SONGPA_GU',
  SEOUL_YANGCHEON_GU = 'SEOUL_YANGCHEON_GU',
  SEOUL_YEONGDEUNGPO_GU = 'SEOUL_YEONGDEUNGPO_GU',
  SEOUL_YONGSAN_GU = 'SEOUL_YONGSAN_GU',
  SEOUL_EUNPYEONG_GU = 'SEOUL_EUNPYEONG_GU',
  SEOUL_JONGNO_GU = 'SEOUL_JONGNO_GU',
  SEOUL_JUNG_GU = 'SEOUL_JUNG_GU',
  SEOUL_JUNGNANG_GU = 'SEOUL_JUNGNANG_GU',

  BUSAN_JUNG_GU = 'BUSAN_JUNG_GU',
  BUSAN_SEO_GU = 'BUSAN_SEO_GU',
  BUSAN_DONG_GU = 'BUSAN_DONG_GU',
  BUSAN_YEONGDO_GU = 'BUSAN_YEONGDO_GU',
  BUSAN_BUSANJIN_GU = 'BUSAN_BUSANJIN_GU',
  BUSAN_DONGNAE_GU = 'BUSAN_DONGNAE_GU',
  BUSAN_NAM_GU = 'BUSAN_NAM_GU',
  BUSAN_BUK_GU = 'BUSAN_BUK_GU',
  BUSAN_HAEUNDAE_GU = 'BUSAN_HAEUNDAE_GU',
  BUSAN_SAHA_GU = 'BUSAN_SAHA_GU',
  BUSAN_GEUMJEONG_GU = 'BUSAN_GEUMJEONG_GU',
  BUSAN_GANGSEO_GU = 'BUSAN_GANGSEO_GU',
  BUSAN_YEONJE_GU = 'BUSAN_YEONJE_GU',
  BUSAN_SUYEONG_GU = 'BUSAN_SUYEONG_GU',
  BUSAN_SASANG_GU = 'BUSAN_SASANG_GU',
  BUSAN_GIJANG_GUN = 'BUSAN_GIJANG_GUN',

  INCHEON_DONG_GU = 'INCHEON_DONG_GU',
  INCHEON_SEO_GU = 'INCHEON_SEO_GU',
  INCHEON_NAMDONG_GU = 'INCHEON_NAMDONG_GU',
  INCHEON_JUNG_GU = 'INCHEON_JUNG_GU',
  INCHEON_YEONSU_GU = 'INCHEON_YEONSU_GU',
  INCHEON_BUPYEONG_GU = 'INCHEON_BUPYEONG_GU',
  INCHEON_MICHUHOL_GU = 'INCHEON_MICHUHOL_GU',
  INCHEON_GYEYANG_GU = 'INCHEON_GYEYANG_GU',
  INCHEON_GANGHWA_GUN = 'INCHEON_GANGHWA_GUN',
  INCHEON_ONGJIN_GUN = 'INCHEON_ONGJIN_GUN',

  ULSAN_DONG_GU = 'ULSAN_DONG_GU',
  ULSAN_NAM_GU = 'ULSAN_NAM_GU',
  ULSAN_BUK_GU = 'ULSAN_BUK_GU',
  ULSAN_JUNG_GU = 'ULSAN_JUNG_GU',
  ULSAN_ULJU_GUN = 'ULSAN_ULJU_GUN',

  DAEJEON_DONG_GU = 'DAEJEON_DONG_GU',
  DAEJEON_SEO_GU = 'DAEJEON_SEO_GU',
  DAEJEON_JUNG_GU = 'DAEJEON_JUNG_GU',
  DAEJEON_DAEDEOK_GU = 'DAEJEON_DAEDEOK_GU',
  DAEJEON_YUSEONG_GU = 'DAEJEON_YUSEONG_GU',

  DAEGU_DONG_GU = 'DAEGU_DONG_GU',
  DAEGU_SEO_GU = 'DAEGU_SEO_GU',
  DAEGU_NAM_GU = 'DAEGU_NAM_GU',
  DAEGU_BUK_GU = 'DAEGU_BUK_GU',
  DAEGU_JUNG_GU = 'DAEGU_JUNG_GU',
  DAEGU_SUSEONG_GU = 'DAEGU_SUSEONG_GU',
  DAEGU_DALSEO_GU = 'DAEGU_DALSEO_GU',
  DAEGU_DALSEONG_GUN = 'DAEGU_DALSEONG_GUN',

  GWANGJU_GWANGSAN_GU = 'GWANGJU_GWANGSAN_GU',
  GWANGJU_DONG_GU = 'GWANGJU_DONG_GU',
  GWANGJU_SEO_GU = 'GWANGJU_SEO_GU',
  GWANGJU_NAM_GU = 'GWANGJU_NAM_GU',
  GWANGJU_BUK_GU = 'GWANGJU_BUK_GU',

  GYEONGGI_GAPYEONG = 'GYEONGGI_GAPYEONG',
  GYEONGGI_GOYANG = 'GYEONGGI_GOYANG',
  GYEONGGI_GWACHEON = 'GYEONGGI_GWACHEON',
  GYEONGGI_GWANGMYEONG = 'GYEONGGI_GWANGMYEONG',
  GYEONGGI_GWANGJU = 'GYEONGGI_GWANGJU',
  GYEONGGI_GURI = 'GYEONGGI_GURI',
  GYEONGGI_GUNPO = 'GYEONGGI_GUNPO',
  GYEONGGI_GIMPO = 'GYEONGGI_GIMPO',
  GYEONGGI_NAMYANGJU = 'GYEONGGI_NAMYANGJU',
  GYEONGGI_DONGDUCHEON = 'GYEONGGI_DONGDUCHEON',
  GYEONGGI_BUCHEON = 'GYEONGGI_BUCHEON',
  GYEONGGI_SEONGNAM = 'GYEONGGI_SEONGNAM',
  GYEONGGI_SUWON = 'GYEONGGI_SUWON',
  GYEONGGI_SIHEUNG = 'GYEONGGI_SIHEUNG',
  GYEONGGI_ANSAN = 'GYEONGGI_ANSAN',
  GYEONGGI_ANSEONG = 'GYEONGGI_ANSEONG',
  GYEONGGI_ANYANG = 'GYEONGGI_ANYANG',
  GYEONGGI_YANGJU = 'GYEONGGI_YANGJU',
  GYEONGGI_YANGPYEONG = 'GYEONGGI_YANGPYEONG',
  GYEONGGI_YEOJU = 'GYEONGGI_YEOJU',
  GYEONGGI_YEONCHEON = 'GYEONGGI_YEONCHEON',
  GYEONGGI_OSAN = 'GYEONGGI_OSAN',
  GYEONGGI_YONGIN = 'GYEONGGI_YONGIN',
  GYEONGGI_UIWANG = 'GYEONGGI_UIWANG',
  GYEONGGI_UIJEONGBU = 'GYEONGGI_UIJEONGBU',
  GYEONGGI_ICHEON = 'GYEONGGI_ICHEON',
  GYEONGGI_PAJU = 'GYEONGGI_PAJU',
  GYEONGGI_PYEONGTAEK = 'GYEONGGI_PYEONGTAEK',
  GYEONGGI_POCHEON = 'GYEONGGI_POCHEON',
  GYEONGGI_HANAM = 'GYEONGGI_HANAM',
  GYEONGGI_HWASEONG = 'GYEONGGI_HWASEONG',

  GANGWON_CHEORWON = 'GANGWON_CHEORWON',
  GANGWON_HWACHEON = 'GANGWON_HWACHEON',
  GANGWON_YANGGU = 'GANGWON_YANGGU',
  GANGWON_GOSEONG = 'GANGWON_GOSEONG',
  GANGWON_SOKCHO = 'GANGWON_SOKCHO',
  GANGWON_INJE = 'GANGWON_INJE',
  GANGWON_YANGYANG = 'GANGWON_YANGYANG',
  GANGWON_CHUNCHEON = 'GANGWON_CHUNCHEON',
  GANGWON_HONGCHEON = 'GANGWON_HONGCHEON',
  GANGWON_GANGNEUNG = 'GANGWON_GANGNEUNG',
  GANGWON_DONGHAE = 'GANGWON_DONGHAE',
  GANGWON_SAMCHEOK = 'GANGWON_SAMCHEOK',
  GANGWON_TAEBAEK = 'GANGWON_TAEBAEK',
  GANGWON_JEONGSEON = 'GANGWON_JEONGSEON',
  GANGWON_PYEONGCHANG = 'GANGWON_PYEONGCHANG',
  GANGWON_HOENGSEONG = 'GANGWON_HOENGSEONG',
  GANGWON_WONJU = 'GANGWON_WONJU',
  GANGWON_YEONGWOL = 'GANGWON_YEONGWOL',

  NORTHERN_JEOLLA_GUNSAN = 'NORTHERN_JEOLLA_GUNSAN',
  NORTHERN_JEOLLA_IKSAN = 'NORTHERN_JEOLLA_IKSAN',
  NORTHERN_JEOLLA_WANJU = 'NORTHERN_JEOLLA_WANJU',
  NORTHERN_JEOLLA_JINAN = 'NORTHERN_JEOLLA_JINAN',
  NORTHERN_JEOLLA_MUJU = 'NORTHERN_JEOLLA_MUJU',
  NORTHERN_JEOLLA_GIMJE = 'NORTHERN_JEOLLA_GIMJE',
  NORTHERN_JEOLLA_JEONJU = 'NORTHERN_JEOLLA_JEONJU',
  NORTHERN_JEOLLA_JANGSU = 'NORTHERN_JEOLLA_JANGSU',
  NORTHERN_JEOLLA_IMSIL = 'NORTHERN_JEOLLA_IMSIL',
  NORTHERN_JEOLLA_BUAN = 'NORTHERN_JEOLLA_BUAN',
  NORTHERN_JEOLLA_JEONGEUP = 'NORTHERN_JEOLLA_JEONGEUP',
  NORTHERN_JEOLLA_GOCHANG = 'NORTHERN_JEOLLA_GOCHANG',
  NORTHERN_JEOLLA_SUNCHANG = 'NORTHERN_JEOLLA_SUNCHANG',
  NORTHERN_JEOLLA_NAMWON = 'NORTHERN_JEOLLA_NAMWON',

  SOUTHERN_JEOLLA_MOKPO = 'SOUTHERN_JEOLLA_MOKPO',
  SOUTHERN_JEOLLA_YEOSU = 'SOUTHERN_JEOLLA_YEOSU',
  SOUTHERN_JEOLLA_SUNCHEON = 'SOUTHERN_JEOLLA_SUNCHEON',
  SOUTHERN_JEOLLA_NAJU = 'SOUTHERN_JEOLLA_NAJU',
  SOUTHERN_JEOLLA_GWANGYANG = 'SOUTHERN_JEOLLA_GWANGYANG',
  SOUTHERN_JEOLLA_DAMYANG = 'SOUTHERN_JEOLLA_DAMYANG',
  SOUTHERN_JEOLLA_GOKSEONG = 'SOUTHERN_JEOLLA_GOKSEONG',
  SOUTHERN_JEOLLA_GURYE = 'SOUTHERN_JEOLLA_GURYE',
  SOUTHERN_JEOLLA_GOHEUNG = 'SOUTHERN_JEOLLA_GOHEUNG',
  SOUTHERN_JEOLLA_BOSEONG = 'SOUTHERN_JEOLLA_BOSEONG',
  SOUTHERN_JEOLLA_HWASUN = 'SOUTHERN_JEOLLA_HWASUN',
  SOUTHERN_JEOLLA_JANGHEUNG = 'SOUTHERN_JEOLLA_JANGHEUNG',
  SOUTHERN_JEOLLA_GANGJIN = 'SOUTHERN_JEOLLA_GANGJIN',
  SOUTHERN_JEOLLA_HAENAM = 'SOUTHERN_JEOLLA_HAENAM',
  SOUTHERN_JEOLLA_YEONGAM = 'SOUTHERN_JEOLLA_YEONGAM',
  SOUTHERN_JEOLLA_MUAN = 'SOUTHERN_JEOLLA_MUAN',
  SOUTHERN_JEOLLA_HAMPYEONG = 'SOUTHERN_JEOLLA_HAMPYEONG',
  SOUTHERN_JEOLLA_YEONGGWANG = 'SOUTHERN_JEOLLA_YEONGGWANG',
  SOUTHERN_JEOLLA_JANGSEONG = 'SOUTHERN_JEOLLA_JANGSEONG',
  SOUTHERN_JEOLLA_WANDO = 'SOUTHERN_JEOLLA_WANDO',
  SOUTHERN_JEOLLA_JINDO = 'SOUTHERN_JEOLLA_JINDO',
  SOUTHERN_JEOLLA_SINAN = 'SOUTHERN_JEOLLA_SINAN',

  NORTHERN_GYEONGSANG_POHANG = 'NORTHERN_GYEONGSANG_POHANG',
  NORTHERN_GYEONGSANG_GYEONGJU = 'NORTHERN_GYEONGSANG_GYEONGJU',
  NORTHERN_GYEONGSANG_GIMCHEON = 'NORTHERN_GYEONGSANG_GIMCHEON',
  NORTHERN_GYEONGSANG_ANDONG = 'NORTHERN_GYEONGSANG_ANDONG',
  NORTHERN_GYEONGSANG_GUMI = 'NORTHERN_GYEONGSANG_GUMI',
  NORTHERN_GYEONGSANG_YEONGJU = 'NORTHERN_GYEONGSANG_YEONGJU',
  NORTHERN_GYEONGSANG_YEONGCHEON = 'NORTHERN_GYEONGSANG_YEONGCHEON',
  NORTHERN_GYEONGSANG_SANGJU = 'NORTHERN_GYEONGSANG_SANGJU',
  NORTHERN_GYEONGSANG_MUNGYEONG = 'NORTHERN_GYEONGSANG_MUNGYEONG',
  NORTHERN_GYEONGSANG_GYEONGSAN = 'NORTHERN_GYEONGSANG_GYEONGSAN',
  NORTHERN_GYEONGSANG_GUNWI = 'NORTHERN_GYEONGSANG_GUNWI',
  NORTHERN_GYEONGSANG_UISEONG = 'NORTHERN_GYEONGSANG_UISEONG',
  NORTHERN_GYEONGSANG_CHEONGSONG = 'NORTHERN_GYEONGSANG_CHEONGSONG',
  NORTHERN_GYEONGSANG_YEONGYANG = 'NORTHERN_GYEONGSANG_YEONGYANG',
  NORTHERN_GYEONGSANG_YEONGDEOK = 'NORTHERN_GYEONGSANG_YEONGDEOK',
  NORTHERN_GYEONGSANG_CHEONGDO = 'NORTHERN_GYEONGSANG_CHEONGDO',
  NORTHERN_GYEONGSANG_GORYEONG = 'NORTHERN_GYEONGSANG_GORYEONG',
  NORTHERN_GYEONGSANG_SEONGJU = 'NORTHERN_GYEONGSANG_SEONGJU',
  NORTHERN_GYEONGSANG_CHILGOK = 'NORTHERN_GYEONGSANG_CHILGOK',
  NORTHERN_GYEONGSANG_YECHEON = 'NORTHERN_GYEONGSANG_YECHEON',
  NORTHERN_GYEONGSANG_BONGHWA = 'NORTHERN_GYEONGSANG_BONGHWA',
  NORTHERN_GYEONGSANG_ULJIN = 'NORTHERN_GYEONGSANG_ULJIN',
  NORTHERN_GYEONGSANG_ULLEUNG = 'NORTHERN_GYEONGSANG_ULLEUNG',

  SOUTHERN_GYEONGSANG_GEOCHANG = 'SOUTHERN_GYEONGSANG_GEOCHANG',
  SOUTHERN_GYEONGSANG_HAPCHEON = 'SOUTHERN_GYEONGSANG_HAPCHEON',
  SOUTHERN_GYEONGSANG_CHANGNYEONG = 'SOUTHERN_GYEONGSANG_CHANGNYEONG',
  SOUTHERN_GYEONGSANG_MIRYANG = 'SOUTHERN_GYEONGSANG_MIRYANG',
  SOUTHERN_GYEONGSANG_YANGSAN = 'SOUTHERN_GYEONGSANG_YANGSAN',
  SOUTHERN_GYEONGSANG_GIMHAE = 'SOUTHERN_GYEONGSANG_GIMHAE',
  SOUTHERN_GYEONGSANG_CHANGWON = 'SOUTHERN_GYEONGSANG_CHANGWON',
  SOUTHERN_GYEONGSANG_HAMAN = 'SOUTHERN_GYEONGSANG_HAMAN',
  SOUTHERN_GYEONGSANG_UIRYEONG = 'SOUTHERN_GYEONGSANG_UIRYEONG',
  SOUTHERN_GYEONGSANG_SANCHEONG = 'SOUTHERN_GYEONGSANG_SANCHEONG',
  SOUTHERN_GYEONGSANG_HAMYANG = 'SOUTHERN_GYEONGSANG_HAMYANG',
  SOUTHERN_GYEONGSANG_HADONG = 'SOUTHERN_GYEONGSANG_HADONG',
  SOUTHERN_GYEONGSANG_JINJU = 'SOUTHERN_GYEONGSANG_JINJU',
  SOUTHERN_GYEONGSANG_SACHEON = 'SOUTHERN_GYEONGSANG_SACHEON',
  SOUTHERN_GYEONGSANG_GOSEONG = 'SOUTHERN_GYEONGSANG_GOSEONG',
  SOUTHERN_GYEONGSANG_TONGYEONG = 'SOUTHERN_GYEONGSANG_TONGYEONG',
  SOUTHERN_GYEONGSANG_GEOJE = 'SOUTHERN_GYEONGSANG_GEOJE',
  SOUTHERN_GYEONGSANG_NAMHAE = 'SOUTHERN_GYEONGSANG_NAMHAE',

  NORTHERN_CHUNGCHEONG_DANYANG = 'NORTHERN_CHUNGCHEONG_DANYANG',
  NORTHERN_CHUNGCHEONG_JECHEON = 'NORTHERN_CHUNGCHEONG_JECHEON',
  NORTHERN_CHUNGCHEONG_CHUNGJU = 'NORTHERN_CHUNGCHEONG_CHUNGJU',
  NORTHERN_CHUNGCHEONG_EUMSEONG = 'NORTHERN_CHUNGCHEONG_EUMSEONG',
  NORTHERN_CHUNGCHEONG_JINCHEON = 'NORTHERN_CHUNGCHEONG_JINCHEON',
  NORTHERN_CHUNGCHEONG_JEUNGPYEONG = 'NORTHERN_CHUNGCHEONG_JEUNGPYEONG',
  NORTHERN_CHUNGCHEONG_GOESAN = 'NORTHERN_CHUNGCHEONG_GOESAN',
  NORTHERN_CHUNGCHEONG_CHEONGJU = 'NORTHERN_CHUNGCHEONG_CHEONGJU',
  NORTHERN_CHUNGCHEONG_BOEUN = 'NORTHERN_CHUNGCHEONG_BOEUN',
  NORTHERN_CHUNGCHEONG_OKCHEON = 'NORTHERN_CHUNGCHEONG_OKCHEON',
  NORTHERN_CHUNGCHEONG_YEONGDONG = 'NORTHERN_CHUNGCHEONG_YEONGDONG',

  SOUTHERN_CHUNGCHEONG_DANGJIN = 'SOUTHERN_CHUNGCHEONG_DANGJIN',
  SOUTHERN_CHUNGCHEONG_SEOSAN = 'SOUTHERN_CHUNGCHEONG_SEOSAN',
  SOUTHERN_CHUNGCHEONG_TAEAN = 'SOUTHERN_CHUNGCHEONG_TAEAN',
  SOUTHERN_CHUNGCHEONG_HONGSEONG = 'SOUTHERN_CHUNGCHEONG_HONGSEONG',
  SOUTHERN_CHUNGCHEONG_CHEONGYANG = 'SOUTHERN_CHUNGCHEONG_CHEONGYANG',
  SOUTHERN_CHUNGCHEONG_BORYEONG = 'SOUTHERN_CHUNGCHEONG_BORYEONG',
  SOUTHERN_CHUNGCHEONG_SEOCHEON = 'SOUTHERN_CHUNGCHEONG_SEOCHEON',
  SOUTHERN_CHUNGCHEONG_ASAN = 'SOUTHERN_CHUNGCHEONG_ASAN',
  SOUTHERN_CHUNGCHEONG_CHEONAN = 'SOUTHERN_CHUNGCHEONG_CHEONAN',
  SOUTHERN_CHUNGCHEONG_YESAN = 'SOUTHERN_CHUNGCHEONG_YESAN',
  SOUTHERN_CHUNGCHEONG_GONGJU = 'SOUTHERN_CHUNGCHEONG_GONGJU',
  SOUTHERN_CHUNGCHEONG_GYERYONG = 'SOUTHERN_CHUNGCHEONG_GYERYONG',
  SOUTHERN_CHUNGCHEONG_GEUMSAN = 'SOUTHERN_CHUNGCHEONG_GEUMSAN',
  SOUTHERN_CHUNGCHEONG_NONSAN = 'SOUTHERN_CHUNGCHEONG_NONSAN',
  SOUTHERN_CHUNGCHEONG_BUYEO = 'SOUTHERN_CHUNGCHEONG_BUYEO',

  JEJU_JEJU = 'JEJU_JEJU',
  JEJU_SEOGWIPO = 'JEJU_SEOGWIPO',
}
