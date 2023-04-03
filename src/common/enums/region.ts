export enum Region {
  SEOUL = 'seoul',
  BUSAN = 'busan',
  INCHEON = 'incheon',
  ULSAN = 'ulsan',
  DAEJEON = 'daejeon',
  DAEGU = 'daegu',
  GWANGJU = 'gwangju',
  SEJONG = 'sejong',
  GYEONGGI = 'gyeonggi',
  GANGWON = 'gangwon',
  NORTHERN_JEOLLA = 'northernJeolla',
  SOUTHERN_JEOLLA = 'southernJeolla',
  NORTHERN_GYEONGSANG = 'northernGyeongsang',
  SOUTHERN_GYEONGSANG = 'southernGyeongsang',
  NORTHERN_CHUNGCHEONG = 'northernChungcheong',
  SOUTHERN_CHUNGCHEONG = 'southernChungcheong',
  JEJU = 'jeju',
}

/*
export enum Region {
  KOREA = 'korea',
  JAPAN = 'japan',
  TAIWAN = 'taiwan',
  PHILIPPINES = 'philippines',
  MALAYSIA = 'malaysia',
  SINGAPORE = 'singapore',
  THAILAND = 'thailand',
  VIETNAM = 'vietnam',
  INDONESIA = 'indonesia',
  HONGKONG = 'hongkong',
  CHINA = 'china',
  GUAM = 'guam',
  CANADA = 'canada',
  AMERICA = 'america',
  AUSTRALIA = 'australia',
  NEW_ZEALAND = 'newZealand',
  ENGLAND = 'england',
  FRANCE = 'france',
  GERMANY = 'germany',
  ITALY = 'italy',
  SPAIN = 'spain',
  OTHER = 'other',

  SEOUL = 'seoul',
  BUSAN = 'busan',
  INCHEON = 'incheon',
  ULSAN = 'ulsan',
  DAEJEON = 'daejeon',
  DAEGU = 'daegu',
  GWANGJU = 'gwangju',
  SEJONG = 'sejong',
  GYEONGGI = 'gyeonggi',
  GANGWON = 'gangwon',
  NORTHERN_JEOLLA = 'northernJeolla',
  SOUTHERN_JEOLLA = 'southernJeolla',
  NORTHERN_GYEONGSANG = 'northernGyeongsang',
  SOUTHERN_GYEONGSANG = 'southernGyeongsang',
  NORTHERN_CHUNGCHEONG = 'northernChungcheong',
  SOUTHERN_CHUNGCHEONG = 'southernChungcheong',
  JEJU = 'jeju',

  SEOUL_GANGNAM_GU = 'seoulGangnamGu',
  SEOUL_GANGDONG_GU = 'seoulGangdongGu',
  SEOUL_GANGBUK_GU = 'seoulGangbukGu',
  SEOUL_GANGSEO_GU = 'seoulGangseoGu',
  SEOUL_GWANAK_GU = 'seoulGwanakGu',
  SEOUL_GWANGJIN_GU = 'seoulGwangjinGu',
  SEOUL_GURO_GU = 'seoulGuroGu',
  SEOUL_GEUMCHEON_GU = 'seoulGeumcheonGu',
  SEOUL_NOWON_GU = 'seoulNowonGu',
  SEOUL_DOBONG_GU = 'seoulDobongGu',
  SEOUL_DONGDAEMUN_GU = 'seoulDongdaemunGu',
  SEOUL_DONGJAK_GU = 'seoulDongjakGu',
  SEOUL_MAPO_GU = 'seoulMapoGu',
  SEOUL_SEODAEMUN_GU = 'seoulSeodaemunGu',
  SEOUL_SEOCHO_GU = 'seoulSeochoGu',
  SEOUL_SEONGDONG_GU = 'seoulSeongdongGu',
  SEOUL_SEONGBUK_GU = 'seoulSeongbukGu',
  SEOUL_SONGPA_GU = 'seoulSongpaGu',
  SEOUL_YANGCHEON_GU = 'seoulYangcheonGu',
  SEOUL_YEONGDEUNGPO_GU = 'seoulYeongdeungpoGu',
  SEOUL_YONGSAN_GU = 'seoulYongsanGu',
  SEOUL_EUNPYEONG_GU = 'seoulEunpyeongGu',
  SEOUL_JONGNO_GU = 'seoulJongnoGu',
  SEOUL_JUNG_GU = 'seoulJungGu',
  SEOUL_JUNGNANG_GU = 'seoulJungnangGu',

  BUSAN_JUNG_GU = 'busanJungGu',
  BUSAN_SEO_GU = 'busanSeoGu',
  BUSAN_DONG_GU = 'busanDongGu',
  BUSAN_YEONGDO_GU = 'busanYeongdoGu',
  BUSAN_BUSANJIN_GU = 'busanBusanjinGu',
  BUSAN_DONGNAE_GU = 'busanDongnaeGu',
  BUSAN_NAM_GU = 'busanNamGu',
  BUSAN_BUK_GU = 'busanBukGu',
  BUSAN_HAEUNDAE_GU = 'busanHaeundaeGu',
  BUSAN_SAHA_GU = 'busanSahaGu',
  BUSAN_GEUMJEONG_GU = 'busanGeumjeongGu',
  BUSAN_GANGSEO_GU = 'busanGangseoGu',
  BUSAN_YEONJE_GU = 'busanYeonjeGu',
  BUSAN_SUYEONG_GU = 'busanSuyeongGu',
  BUSAN_SASANG_GU = 'busanSasangGu',
  BUSAN_GIJANG_GUN = 'busanGijangGun',

  INCHEON_DONG_GU = 'incheonDongGu',
  INCHEON_SEO_GU = 'incheonSeoGu',
  INCHEON_NAMDONG_GU = 'incheonNamdongGu',
  INCHEON_JUNG_GU = 'incheonJungGu',
  INCHEON_YEONSU_GU = 'incheonYeonsuGu',
  INCHEON_BUPYEONG_GU = 'incheonBupyeongGu',
  INCHEON_MICHUHOL_GU = 'incheonMichuholGu',
  INCHEON_GYEYANG_GU = 'incheonGyeyangGu',
  INCHEON_GANGHWA_GUN = 'incheonGanghwaGun',
  INCHEON_ONGJIN_GUN = 'incheonOngjinGun',

  ULSAN_DONG_GU = 'ulsanDongGu',
  ULSAN_NAM_GU = 'ulsanNamGu',
  ULSAN_BUK_GU = 'ulsanBukGu',
  ULSAN_JUNG_GU = 'ulsanJungGu',
  ULSAN_ULJU_GUN = 'ulsanUljuGun',

  DAEJEON_DONG_GU = 'daejeonDongGu',
  DAEJEON_SEO_GU = 'daejeonSeoGu',
  DAEJEON_JUNG_GU = 'daejeonJungGu',
  DAEJEON_DAEDEOK_GU = 'daejeonDaedeokGu',
  DAEJEON_YUSEONG_GU = 'daejeonYuseongGu',

  DAEGU_DONG_GU = 'daeguDongGu',
  DAEGU_SEO_GU = 'daeguSeoGu',
  DAEGU_NAM_GU = 'daeguNamGu',
  DAEGU_BUK_GU = 'daeguBukGu',
  DAEGU_JUNG_GU = 'daeguJungGu',
  DAEGU_SUSEONG_GU = 'daeguSuseongGu',
  DAEGU_DALSEO_GU = 'daeguDalseoGu',
  DAEGU_DALSEONG_GUN = 'daeguDalseongGun',

  GWANGJU_GWANGSAN_GU = 'gwangjuGwangsanGu',
  GWANGJU_DONG_GU = 'gwangjuDongGu',
  GWANGJU_SEO_GU = 'gwangjuSeoGu',
  GWANGJU_NAM_GU = 'gwangjuNamGu',
  GWANGJU_BUK_GU = 'gwangjuBukGu',

  GYEONGGI_GAPYEONG = 'gyeonggiGapyeong',
  GYEONGGI_GOYANG = 'gyeonggiGoyang',
  GYEONGGI_GWACHEON = 'gyeonggiGwacheon',
  GYEONGGI_GWANGMYEONG = 'gyeonggiGwangmyeong',
  GYEONGGI_GWANGJU = 'gyeonggiGwangju',
  GYEONGGI_GURI = 'gyeonggiGuri',
  GYEONGGI_GUNPO = 'gyeonggiGunpo',
  GYEONGGI_GIMPO = 'gyeonggiGimpo',
  GYEONGGI_NAMYANGJU = 'gyeonggiNamyangju',
  GYEONGGI_DONGDUCHEON = 'gyeonggiDongducheon',
  GYEONGGI_BUCHEON = 'gyeonggiBucheon',
  GYEONGGI_SEONGNAM = 'gyeonggiSeongnam',
  GYEONGGI_SUWON = 'gyeonggiSuwon',
  GYEONGGI_SIHEUNG = 'gyeonggiSiheung',
  GYEONGGI_ANSAN = 'gyeonggiAnsan',
  GYEONGGI_ANSEONG = 'gyeonggiAnseong',
  GYEONGGI_ANYANG = 'gyeonggiAnyang',
  GYEONGGI_YANGJU = 'gyeonggiYangju',
  GYEONGGI_YANGPYEONG = 'gyeonggiYangpyeong',
  GYEONGGI_YEOJU = 'gyeonggiYeoju',
  GYEONGGI_YEONCHEON = 'gyeonggiYeoncheon',
  GYEONGGI_OSAN = 'gyeonggiOsan',
  GYEONGGI_YONGIN = 'gyeonggiYongin',
  GYEONGGI_UIWANG = 'gyeonggiUiwang',
  GYEONGGI_UIJEONGBU = 'gyeonggiUijeongbu',
  GYEONGGI_ICHEON = 'gyeonggiIcheon',
  GYEONGGI_PAJU = 'gyeonggiPaju',
  GYEONGGI_PYEONGTAEK = 'gyeonggiPyeongtaek',
  GYEONGGI_POCHEON = 'gyeonggiPocheon',
  GYEONGGI_HANAM = 'gyeonggiHanam',
  GYEONGGI_HWASEONG = 'gyeonggiHwaseong',

  GANGWON_CHEORWON = 'gangwonCheorwon',
  GANGWON_HWACHEON = 'gangwonHwacheon',
  GANGWON_YANGGU = 'gangwonYanggu',
  GANGWON_GOSEONG = 'gangwonGoseong',
  GANGWON_SOKCHO = 'gangwonSokcho',
  GANGWON_INJE = 'gangwonInje',
  GANGWON_YANGYANG = 'gangwonYangyang',
  GANGWON_CHUNCHEON = 'gangwonChuncheon',
  GANGWON_HONGCHEON = 'gangwonHongcheon',
  GANGWON_GANGNEUNG = 'gangwonGangneung',
  GANGWON_DONGHAE = 'gangwonDonghae',
  GANGWON_SAMCHEOK = 'gangwonSamcheok',
  GANGWON_TAEBAEK = 'gangwonTaebaek',
  GANGWON_JEONGSEON = 'gangwonJeongseon',
  GANGWON_PYEONGCHANG = 'gangwonPyeongchang',
  GANGWON_HOENGSEONG = 'gangwonHoengseong',
  GANGWON_WONJU = 'gangwonWonju',
  GANGWON_YEONGWOL = 'gangwonYeongwol',

  NORTHERN_JEOLLA_GUNSAN = 'northernJeollaGunsan',
  NORTHERN_JEOLLA_IKSAN = 'northernJeollaIksan',
  NORTHERN_JEOLLA_WANJU = 'northernJeollaWanju',
  NORTHERN_JEOLLA_JINAN = 'northernJeollaJinan',
  NORTHERN_JEOLLA_MUJU = 'northernJeollaMuju',
  NORTHERN_JEOLLA_GIMJE = 'northernJeollaGimje',
  NORTHERN_JEOLLA_JEONJU = 'northernJeollaJeonju',
  NORTHERN_JEOLLA_JANGSU = 'northernJeollaJangsu',
  NORTHERN_JEOLLA_IMSIL = 'northernJeollaImsil',
  NORTHERN_JEOLLA_BUAN = 'northernJeollaBuan',
  NORTHERN_JEOLLA_JEONGEUP = 'northernJeollaJeongeup',
  NORTHERN_JEOLLA_GOCHANG = 'northernJeollaGochang',
  NORTHERN_JEOLLA_SUNCHANG = 'northernJeollaSunchang',
  NORTHERN_JEOLLA_NAMWON = 'northernJeollaNamwon',

  SOUTHERN_JEOLLA_MOKPO = 'southernJeollaMokpo',
  SOUTHERN_JEOLLA_YEOSU = 'southernJeollaYeosu',
  SOUTHERN_JEOLLA_SUNCHEON = 'southernJeollaSuncheon',
  SOUTHERN_JEOLLA_NAJU = 'southernJeollaNaju',
  SOUTHERN_JEOLLA_GWANGYANG = 'southernJeollaGwangyang',
  SOUTHERN_JEOLLA_DAMYANG = 'southernJeollaDamyang',
  SOUTHERN_JEOLLA_GOKSEONG = 'southernJeollaGokseong',
  SOUTHERN_JEOLLA_GURYE = 'southernJeollaGurye',
  SOUTHERN_JEOLLA_GOHEUNG = 'southernJeollaGoheung',
  SOUTHERN_JEOLLA_BOSEONG = 'southernJeollaBoseong',
  SOUTHERN_JEOLLA_HWASUN = 'southernJeollaHwasun',
  SOUTHERN_JEOLLA_JANGHEUNG = 'southernJeollaJangheung',
  SOUTHERN_JEOLLA_GANGJIN = 'southernJeollaGangjin',
  SOUTHERN_JEOLLA_HAENAM = 'southernJeollaHaenam',
  SOUTHERN_JEOLLA_YEONGAM = 'southernJeollaYeongam',
  SOUTHERN_JEOLLA_MUAN = 'southernJeollaMuan',
  SOUTHERN_JEOLLA_HAMPYEONG = 'southernJeollaHampyeong',
  SOUTHERN_JEOLLA_YEONGGWANG = 'southernJeollaYeonggwang',
  SOUTHERN_JEOLLA_JANGSEONG = 'southernJeollaJangseong',
  SOUTHERN_JEOLLA_WANDO = 'southernJeollaWando',
  SOUTHERN_JEOLLA_JINDO = 'southernJeollaJindo',
  SOUTHERN_JEOLLA_SINAN = 'southernJeollaSinan',

  NORTHERN_GYEONGSANG_POHANG = 'northernGyeongsangPohang',
  NORTHERN_GYEONGSANG_GYEONGJU = 'northernGyeongsangGyeongju',
  NORTHERN_GYEONGSANG_GIMCHEON = 'northernGyeongsangGimcheon',
  NORTHERN_GYEONGSANG_ANDONG = 'northernGyeongsangAndong',
  NORTHERN_GYEONGSANG_GUMI = 'northernGyeongsangGumi',
  NORTHERN_GYEONGSANG_YEONGJU = 'northernGyeongsangYeongju',
  NORTHERN_GYEONGSANG_YEONGCHEON = 'northernGyeongsangYeongcheon',
  NORTHERN_GYEONGSANG_SANGJU = 'northernGyeongsangSangju',
  NORTHERN_GYEONGSANG_MUNGYEONG = 'northernGyeongsangMungyeong',
  NORTHERN_GYEONGSANG_GYEONGSAN = 'northernGyeongsangGyeongsan',
  NORTHERN_GYEONGSANG_GUNWI = 'northernGyeongsangGunwi',
  NORTHERN_GYEONGSANG_UISEONG = 'northernGyeongsangUiseong',
  NORTHERN_GYEONGSANG_CHEONGSONG = 'northernGyeongsangCheongsong',
  NORTHERN_GYEONGSANG_YEONGYANG = 'northernGyeongsangYeongyang',
  NORTHERN_GYEONGSANG_YEONGDEOK = 'northernGyeongsangYeongdeok',
  NORTHERN_GYEONGSANG_CHEONGDO = 'northernGyeongsangCheongdo',
  NORTHERN_GYEONGSANG_GORYEONG = 'northernGyeongsangGoryeong',
  NORTHERN_GYEONGSANG_SEONGJU = 'northernGyeongsangSeongju',
  NORTHERN_GYEONGSANG_CHILGOK = 'northernGyeongsangChilgok',
  NORTHERN_GYEONGSANG_YECHEON = 'northernGyeongsangYecheon',
  NORTHERN_GYEONGSANG_BONGHWA = 'northernGyeongsangBonghwa',
  NORTHERN_GYEONGSANG_ULJIN = 'northernGyeongsangUljin',
  NORTHERN_GYEONGSANG_ULLEUNG = 'northernGyeongsangUlleung',

  SOUTHERN_GYEONGSANG_GEOCHANG = 'southernGyeongsangGeochang',
  SOUTHERN_GYEONGSANG_HAPCHEON = 'southernGyeongsangHapcheon',
  SOUTHERN_GYEONGSANG_CHANGNYEONG = 'southernGyeongsangChangnyeong',
  SOUTHERN_GYEONGSANG_MIRYANG = 'southernGyeongsangMiryang',
  SOUTHERN_GYEONGSANG_YANGSAN = 'southernGyeongsangYangsan',
  SOUTHERN_GYEONGSANG_GIMHAE = 'southernGyeongsangGimhae',
  SOUTHERN_GYEONGSANG_CHANGWON = 'southernGyeongsangChangwon',
  SOUTHERN_GYEONGSANG_HAMAN = 'southernGyeongsangHaman',
  SOUTHERN_GYEONGSANG_UIRYEONG = 'southernGyeongsangUiryeong',
  SOUTHERN_GYEONGSANG_SANCHEONG = 'southernGyeongsangSancheong',
  SOUTHERN_GYEONGSANG_HAMYANG = 'southernGyeongsangHamyang',
  SOUTHERN_GYEONGSANG_HADONG = 'southernGyeongsangHadong',
  SOUTHERN_GYEONGSANG_JINJU = 'southernGyeongsangJinju',
  SOUTHERN_GYEONGSANG_SACHEON = 'southernGyeongsangSacheon',
  SOUTHERN_GYEONGSANG_GOSEONG = 'southernGyeongsangGoseong',
  SOUTHERN_GYEONGSANG_TONGYEONG = 'southernGyeongsangTongyeong',
  SOUTHERN_GYEONGSANG_GEOJE = 'southernGyeongsangGeoje',
  SOUTHERN_GYEONGSANG_NAMHAE = 'southernGyeongsangNamhae',

  NORTHERN_CHUNGCHEONG_DANYANG = 'northernChungcheongDanyang',
  NORTHERN_CHUNGCHEONG_JECHEON = 'northernChungcheongJecheon',
  NORTHERN_CHUNGCHEONG_CHUNGJU = 'northernChungcheongChungju',
  NORTHERN_CHUNGCHEONG_EUMSEONG = 'northernChungcheongEumseong',
  NORTHERN_CHUNGCHEONG_JINCHEON = 'northernChungcheongJincheon',
  NORTHERN_CHUNGCHEONG_JEUNGPYEONG = 'northernChungcheongJeungpyeong',
  NORTHERN_CHUNGCHEONG_GOESAN = 'northernChungcheongGoesan',
  NORTHERN_CHUNGCHEONG_CHEONGJU = 'northernChungcheongCheongju',
  NORTHERN_CHUNGCHEONG_BOEUN = 'northernChungcheongBoeun',
  NORTHERN_CHUNGCHEONG_OKCHEON = 'northernChungcheongOkcheon',
  NORTHERN_CHUNGCHEONG_YEONGDONG = 'northernChungcheongYeongdong',

  SOUTHERN_CHUNGCHEONG_DANGJIN = 'southernChungcheongDangjin',
  SOUTHERN_CHUNGCHEONG_SEOSAN = 'southernChungcheongSeosan',
  SOUTHERN_CHUNGCHEONG_TAEAN = 'southernChungcheongTaean',
  SOUTHERN_CHUNGCHEONG_HONGSEONG = 'southernChungcheongHongseong',
  SOUTHERN_CHUNGCHEONG_CHEONGYANG = 'southernChungcheongCheongyang',
  SOUTHERN_CHUNGCHEONG_BORYEONG = 'southernChungcheongBoryeong',
  SOUTHERN_CHUNGCHEONG_SEOCHEON = 'southernChungcheongSeocheon',
  SOUTHERN_CHUNGCHEONG_ASAN = 'southernChungcheongAsan',
  SOUTHERN_CHUNGCHEONG_CHEONAN = 'southernChungcheongCheonan',
  SOUTHERN_CHUNGCHEONG_YESAN = 'southernChungcheongYesan',
  SOUTHERN_CHUNGCHEONG_GONGJU = 'southernChungcheongGongju',
  SOUTHERN_CHUNGCHEONG_GYERYONG = 'southernChungcheongGyeryong',
  SOUTHERN_CHUNGCHEONG_GEUMSAN = 'southernChungcheongGeumsan',
  SOUTHERN_CHUNGCHEONG_NONSAN = 'southernChungcheongNonsan',
  SOUTHERN_CHUNGCHEONG_BUYEO = 'southernChungcheongBuyeo',

  JEJU_JEJU = 'jejuJeju',
  JEJU_SEOGWIPO = 'jejuSeogwipo',
}
*/
