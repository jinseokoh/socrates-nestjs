export enum Career {
  // STUDENT
  SCHOOL_OF_MEDICINE = 'SCHOOL_OF_MEDICINE',
  SCHOOL_OF_PHARMACY = 'SCHOOL_OF_PHARMACY',
  SCHOOL_OF_NURSING = 'SCHOOL_OF_NURSING',
  SCHOOL_OF_VETERINARY_MEDICINE = 'SCHOOL_OF_VETERINARY_MEDICINE',
  SCHOOL_OF_LAW = 'SCHOOL_OF_LAW',
  SCHOOL_OF_ENGINEERING = 'SCHOOL_OF_ENGINEERING',
  SCHOOL_OF_SCIENCE = 'SCHOOL_OF_SCIENCE',
  SCHOOL_OF_BUSINESS = 'SCHOOL_OF_BUSINESS',
  SCHOOL_OF_LANGUAGE_AND_LITERATURE = 'SCHOOL_OF_LANGUAGE_AND_LITERATURE',
  SCHOOL_OF_EDUCATION = 'SCHOOL_OF_EDUCATION',
  SCHOOL_OF_MUSIC = 'SCHOOL_OF_MUSIC',
  SCHOOL_OF_ARTS = 'SCHOOL_OF_ARTS',
  SCHOOL_OF_SPORTS = 'SCHOOL_OF_SPORTS',
  MILITARY_ACADEMY = 'MILITARY_ACADEMY',
  SCHOOL_OF_OTHER_CATEGORIES = 'SCHOOL_OF_OTHER_CATEGORIES',

  // ENTREPRENEUR
  STARTUP = 'STARTUP',
  VENTURE_CAPITAL = 'VENTURE_CAPITAL',
  REAL_ESTATE_INVESTMENT = 'REAL_ESTATE_INVESTMENT',
  FRANCHISE = 'FRANCHISE',
  SMALL_BUSINESS = 'SMALL_BUSINESS',
  FREELANCER = 'FREELANCER',
  OTHER_ENTREPRENEUR = 'OTHER_ENTREPRENEUR',

  // MEDICAL
  DOCTOR = 'DOCTOR',
  ORIENTAL_DOCTOR = 'ORIENTAL_DOCTOR',
  PHARMACIST = 'PHARMACIST',
  ORIENTAL_PHARMACIST = 'ORIENTAL_PHARMACIST',
  VET = 'VET',
  NURSE = 'NURSE',
  OTHER_MEDICAL = 'OTHER_MEDICAL',

  // LEGAL
  JUDGE = 'JUDGE',
  PROSECUTOR = 'PROSECUTOR',
  LAWYER = 'LAWYER',
  OTHER_LEGAL = 'OTHER_LEGAL',

  // HIGH_PAYING_PROFESSION
  PUBLIC_APPRAISER = 'PUBLIC_APPRAISER',
  ARCHITECT = 'ARCHITECT',
  MANAGEMENT_CONSULTANT = 'MANAGEMENT_CONSULTANT',
  FUND_MANAGER = 'FUND_MANAGER',
  LABOR_CONSULTANT = 'LABOR_CONSULTANT',
  PUBLIC_ACCOUNTANT = 'PUBLIC_ACCOUNTANT',
  CUSTOMS_AGENT = 'CUSTOMS_AGENT',
  JUDICIAL_SCRIVENER = 'JUDICIAL_SCRIVENER',
  PATENT_ATTORNEY = 'PATENT_ATTORNEY',
  ACTUARY = 'ACTUARY',
  TAX_ACCOUNTANT = 'TAX_ACCOUNTANT',
  CLAIM_ADJUSTER = 'CLAIM_ADJUSTER',
  FINANCIAL_PLANNER = 'FINANCIAL_PLANNER',
  PILOT = 'PILOT',
  FLIGHT_ATTENDANT = 'FLIGHT_ATTENDANT',
  FLIGHT_ENGINEER = 'FLIGHT_ENGINEER',
  AIR_TRAFFIC_CONTROLLER = 'AIR_TRAFFIC_CONTROLLER',
  SURVEYOR = 'SURVEYOR',
  PUBLIC_ATTORNEY = 'PUBLIC_ATTORNEY',
  OTHER_HIGH_PAYING_PROFESSION = 'OTHER_HIGH_PAYING_PROFESSION',

  // FINANCIAL
  BANK = 'BANK',
  SECURITIES = 'SECURITIES',
  INSURANCE = 'INSURANCE',
  ACCOUNTING = 'ACCOUNTING',
  CRYPTOCURRENCY = 'CRYPTOCURRENCY',
  OTHER_FINANCIAL = 'OTHER_FINANCIAL',

  // RESEARCH
  IT_RESEARCHER = 'IT_RESEARCHER',
  SEMICONDUCTOR_RESEARCHER = 'SEMICONDUCTOR_RESEARCHER',
  SCIENCE_RESEARCHER = 'SCIENCE_RESEARCHER',
  CHEMICAL_RESEARCHER = 'CHEMICAL_RESEARCHER',
  MECHANICAL_RESEARCHER = 'MECHANICAL_RESEARCHER',
  BIO_RESEARCHER = 'BIO_RESEARCHER',
  OTHER_RESEARCHER = 'OTHER_RESEARCHER',

  // ENGINEER
  SOFTWARE_ENGINEER = 'SOFTWARE_ENGINEER',
  HARDWARE_ENGINEER = 'HARDWARE_ENGINEER',
  ARCHITECTUAL_ENGINEER = 'ARCHITECTUAL_ENGINEER',
  ELECTRICAL_ENGINEER = 'ELECTRICAL_ENGINEER',
  MARINE_ENGINEER = 'MARINE_ENGINEER',
  MECHANICAL_ENGINEER = 'MECHANICAL_ENGINEER',
  OTHER_ENGINEER = 'OTHER_ENGINEER',

  // DESIGN
  GRAPHIC_DESIGNER = 'GRAPHIC_DESIGNER',
  UI_UX_DESIGNER = 'UI_UX_DESIGNER',
  FASHION_DESIGNER = 'FASHION_DESIGNER',
  INTERIOR_DESIGNER = 'INTERIOR_DESIGNER',
  PRODUCT_DESIGNER = 'PRODUCT_DESIGNER',
  OTHER_DESIGNER = 'OTHER_DESIGNER',

  // TEACHING
  KINDERGARTEN_TEACHER = 'KINDERGARTEN_TEACHER',
  SCHOOL_TEACHER = 'SCHOOL_TEACHER',
  PROFESSOR = 'PROFESSOR',
  ACADEMY_INSTRUCTOR = 'ACADEMY_INSTRUCTOR',
  TUTOR = 'TUTOR',
  OTHER_TEACHING = 'OTHER_TEACHING',

  // MEDIA
  JOURNALIST = 'JOURNALIST',
  JOURNAL_EDITOR = 'JOURNAL_EDITOR',
  BROADCASTING_WRITER = 'BROADCASTING_WRITER',
  ACTOR = 'ACTOR',
  COMEDIAN = 'COMEDIAN',
  VOICE_ACTOR = 'VOICE_ACTOR',
  MODEL = 'MODEL',
  ANNOUNCER = 'ANNOUNCER',
  OTHER_MEDIA = 'OTHER_MEDIA',

  // ENTERTAINMENT
  ENTERTAINMENT_MANAGER = 'ENTERTAINMENT_MANAGER',
  E_SPORTS_PLAYER = 'E_SPORTS_PLAYER',
  STREAMER = 'STREAMER',
  INFLUENCER = 'INFLUENCER',
  OTHER_ENTERTAINMENT = 'OTHER_ENTERTAINMENT',

  // SPORTS
  COACH = 'COACH',
  SPORTS_INSTRUCTOR = 'SPORTS_INSTRUCTOR',
  ATHLETE = 'ATHLETE',
  FITNESS_TRAINER = 'FITNESS_TRAINER',
  OTHER_SPORTS = 'OTHER_SPORTS',

  // ARTS
  VOCALIST = 'VOCALIST',
  MUSICIAN = 'MUSICIAN',
  DANCER = 'DANCER',
  PAINTER = 'PAINTER',
  SCULPTOR = 'SCULPTOR',
  OTHER_ARTS = 'OTHER_ARTS',

  // SERVICE
  CUSTOMER_SERVICE = 'CUSTOMER_SERVICE',
  LANGUAGE_SERVICE = 'LANGUAGE_SERVICE',
  BEAUTY_SERVICE = 'BEAUTY_SERVICE',
  ENVIRONMENTAL_SERVICES = 'ENVIRONMENTAL_SERVICES',
  PET_SERVICE = 'PET_SERVICE',
  SECURITY_SERVICE = 'SECURITY_SERVICE',
  OTHER_SERVICE = 'OTHER_SERVICE',

  // GOVERNMENT
  GOVERNMENT_OFFICIAL = 'GOVERNMENT_OFFICIAL',
  FOREIGN_SERVICE = 'FOREIGN_SERVICE',
  POLICE_FORCE = 'POLICE_FORCE',
  FIRE_SERVICE = 'FIRE_SERVICE',
  MILITARY_SERVICE = 'MILITARY_SERVICE',
  SOLDIER = 'SOLDIER',
  OTHER_GOVERNMENT = 'OTHER_GOVERNMENT',

  // OTHER
  SALES = 'SALES',
  RETAIL = 'RETAIL',
  FARMING = 'FARMING',
  FISHERY = 'FISHERY',
  BETWEEN_JOBS = 'BETWEEN_JOBS',
  NONE = 'NONE',
}


/**
 * @deprecated
 *
 * @method static self student()
 * @method static self accounting()
 * @method static self airlines__aviation()
 * @method static self alternative_dispute_resolution()
 * @method static self alternative_medicine()
 * @method static self animation()
 * @method static self apparel__fashion()
 * @method static self architecture__planning()
 * @method static self arts__crafts()
 * @method static self automotive()
 * @method static self aviation__aerospace()
 * @method static self banking()
 * @method static self biotechnology()
 * @method static self broadcast_media()
 * @method static self building_materials()
 * @method static self business_supplies__equipment()
 * @method static self capital_markets()
 * @method static self chemicals()
 * @method static self civic__social_organization()
 * @method static self civil_engineering()
 * @method static self commercial_real_estate()
 * @method static self computer__network_security()
 * @method static self computer_games()
 * @method static self computer_hardware()
 * @method static self computer_networking()
 * @method static self computer_software()
 * @method static self construction()
 * @method static self consumer_electronics()
 * @method static self consumer_goods()
 * @method static self consumer_services()
 * @method static self cosmetics()
 * @method static self dairy()
 * @method static self defense__space()
 * @method static self design()
 * @method static self e_learning()
 * @method static self education_management()
 * @method static self electrical__electronic_manufacturing()
 * @method static self entertainment()
 * @method static self environmental_services()
 * @method static self events_services()
 * @method static self executive_office()
 * @method static self facilities_services()
 * @method static self farming()
 * @method static self financial_services()
 * @method static self fine_art()
 * @method static self fishery()
 * @method static self food__beverages()
 * @method static self food_production()
 * @method static self fundraising()
 * @method static self furniture()
 * @method static self gambling__casinos()
 * @method static self glass__ceramics__concrete()
 * @method static self government_administration()
 * @method static self government_relations()
 * @method static self graphic_design()
 * @method static self health__wellness__fitness()
 * @method static self higher_education()
 * @method static self hospital__health_care()
 * @method static self hospitality()
 * @method static self human_resources()
 * @method static self import__export()
 * @method static self individual__family_services()
 * @method static self industrial_automation()
 * @method static self information_services()
 * @method static self information_technology__services()
 * @method static self insurance()
 * @method static self international_affairs()
 * @method static self international_trade__development()
 * @method static self internet()
 * @method static self investment_banking()
 * @method static self investment_management()
 * @method static self judiciary()
 * @method static self law_enforcement()
 * @method static self law_practice()
 * @method static self legal_services()
 * @method static self legislative_office()
 * @method static self leisure__travel__tourism()
 * @method static self libraries()
 * @method static self logistics__supply_chain()
 * @method static self luxury_goods__jewelry()
 * @method static self machinery()
 * @method static self management_consulting()
 * @method static self maritime()
 * @method static self market_research()
 * @method static self marketing__advertising()
 * @method static self mechanical_or_industrial_engineering()
 * @method static self media_production()
 * @method static self medical_device()
 * @method static self medical_practice()
 * @method static self mental_health_care()
 * @method static self military()
 * @method static self mining__metals()
 * @method static self motion_pictures__film()
 * @method static self museums__institutions()
 * @method static self music()
 * @method static self nanotechnology()
 * @method static self newspapers()
 * @method static self non_profit_organization_management()
 * @method static self oil__energy()
 * @method static self online_media()
 * @method static self outsourcing__offshoring()
 * @method static self package__freight_delivery()
 * @method static self packaging__containers()
 * @method static self paper__forest_products()
 * @method static self performing_arts()
 * @method static self pharmaceuticals()
 * @method static self philanthropy()
 * @method static self photography()
 * @method static self plastics()
 * @method static self political_organization()
 * @method static self primary__secondary_education()
 * @method static self printing()
 * @method static self professional_training__coaching()
 * @method static self program_development()
 * @method static self public_policy()
 * @method static self public_relations__communications()
 * @method static self public_safety()
 * @method static self publishing()
 * @method static self railroad_manufacture()
 * @method static self ranching()
 * @method static self real_estate()
 * @method static self recreational_facilities__services()
 * @method static self religious_institutions()
 * @method static self renewables__environment()
 * @method static self research()
 * @method static self restaurants()
 * @method static self retail()
 * @method static self security__investigations()
 * @method static self semiconductors()
 * @method static self shipbuilding()
 * @method static self sporting_goods()
 * @method static self sports()
 * @method static self staffing__recruiting()
 * @method static self supermarkets()
 * @method static self telecommunications()
 * @method static self textiles()
 * @method static self think_tanks()
 * @method static self tobacco()
 * @method static self translation__localization()
 * @method static self transportation__trucking__railroad()
 * @method static self utilities()
 * @method static self venture_capital__private_equity()
 * @method static self veterinary()
 * @method static self warehousing()
 * @method static self wholesale()
 * @method static self wine__spirits()
 * @method static self wireless()
 * @method static self writing__editing()
 */

/**
 * @deprecated
 *
 * @method static self student()
 * @method static self school_of_medicine()
 * @method static self school_of_pharmacy()
 * @method static self school_of_nursing()
 * @method static self school_of_veterinary_medicine()
 * @method static self school_of_law()
 * @method static self school_of_engineering()
 * @method static self school_of_science()
 * @method static self school_of_business()
 * @method static self school_of_language_and_literature()
 * @method static self school_of_education()
 * @method static self school_of_music()
 * @method static self school_of_arts()
 * @method static self school_of_sports()
 * @method static self military_academy()
 * @method static self school_of_other_categories()
 *
 * @method static self entrepreneur()
 * @method static self startup()
 * @method static self venture_capital()
 * @method static self real_estate_investment()
 * @method static self franchise()
 * @method static self small_business()
 * @method static self freelancer()
 * @method static self other_entrepreneur()
 *
 * @method static self medical()
 * @method static self doctor()
 * @method static self oriental_doctor()
 * @method static self pharmacist()
 * @method static self oriental_pharmacist()
 * @method static self vet()
 * @method static self nurse()
 * @method static self other_medical()
 *
 * @method static self legal()
 * @method static self judge()
 * @method static self prosecutor()
 * @method static self lawyer()
 * @method static self other_legal()
 *
 * @method static self high_paying_profession()
 * @method static self public_appraiser()
 * @method static self architect()
 * @method static self management_consultant()
 * @method static self fund_manager()
 * @method static self labor_consultant()
 * @method static self public_accountant()
 * @method static self customs_agent()
 * @method static self judicial_scrivener()
 * @method static self patent_attorney()
 * @method static self actuary()
 * @method static self tax_accountant()
 * @method static self claim_adjuster()
 * @method static self financial_planner()
 * @method static self pilot()
 * @method static self flight_attendant()
 * @method static self flight_engineer()
 * @method static self air_traffic_controller()
 * @method static self surveyor()
 * @method static self public_attorney()
 * @method static self other_high_paying_profession()
 *
 * @method static self financial()
 * @method static self bank()
 * @method static self securities()
 * @method static self insurance()
 * @method static self accounting()
 * @method static self other_financial()
 *
 * @method static self research()
 * @method static self it_researcher()
 * @method static self semiconductor_researcher()
 * @method static self science_researcher()
 * @method static self chemical_researcher()
 * @method static self mechanical_researcher()
 * @method static self bio_researcher()
 * @method static self other_researcher()
 *
 * @method static self engineer()
 * @method static self software_engineer()
 * @method static self hardware_engineer()
 * @method static self architectual_engineer()
 * @method static self electrical_engineer()
 * @method static self marine_engineer()
 * @method static self mechanical_engineer()
 * @method static self other_engineer()
 *
 * @method static self design()
 * @method static self graphic_designer()
 * @method static self ui_ux_designer()
 * @method static self fashion_designer()
 * @method static self interior_designer()
 * @method static self product_designer()
 * @method static self other_designer()
 *
 * @method static self teaching()
 * @method static self kindergarten_teacher()
 * @method static self school_teacher()
 * @method static self professor()
 * @method static self academy_instructor()
 * @method static self tutor()
 * @method static self other_teaching()
 *
 * @method static self media()
 * @method static self journalist()
 * @method static self journal_editor()
 * @method static self broadcasting_writer()
 * @method static self actor()
 * @method static self comedian()
 * @method static self voice_actor()
 * @method static self model()
 * @method static self announcer()
 * @method static self other_media()
 *
 * @method static self entertainment()
 * @method static self entertainment_manager()
 * @method static self e_sports_player()
 * @method static self streamer()
 * @method static self influencer()
 * @method static self other_entertainment()
 *
 * @method static self sports()
 * @method static self coach()
 * @method static self sports_instructor()
 * @method static self athlete()
 * @method static self fitness_trainer()
 * @method static self other_sports()
 *
 * @method static self arts()
 * @method static self vocalist()
 * @method static self musician()
 * @method static self dancer()
 * @method static self painter()
 * @method static self sculptor()
 * @method static self other_arts()
 *
 * @method static self service()
 * @method static self customer_service()
 * @method static self language_service()
 * @method static self beauty_service()
 * @method static self environmental_services()
 * @method static self pet_service()
 * @method static self security_service()
 * @method static self other_service()
 *
 * @method static self government()
 * @method static self government_official()
 * @method static self foreign_service()
 * @method static self police_force()
 * @method static self fire_service()
 * @method static self military_service()
 * @method static self soldier()
 * @method static self other_government()
 *
 * @method static self other()
 * @method static self sales()
 * @method static self retail()
 * @method static self farming()
 * @method static self fishery()
 * @method static self between_jobs()
 * @method static self none()
 *
 */
