# Entity TABLEs

# table article
# table article_auction
# table artist
# table artwork
# table artwork_user_like
# table auction
# table auction_user_alarm
# table bid
# table book
# table book_article
# table comment
# table coupon
# table destination
# table follow
# table grant
# table hashtag
# table hashtag_artwork
# table news
# table order
# table pack
# table pack_artist
# table pack_auction
# table payment
# table portal
# table profile
# table provider
# table user


## USER (사용자; entity)
  * ATTRIBUTES
    - id (bigint)
    - username (unique)
    - phone (unique; international format)
    - email (unique)
    - password
    - realname (실명)
    - avatar (사진)
    - push_token
    - refresh_token_hash
    - role (USER | ADMIN | SUPER)
    - level (F | L | E | A)
    - locale
    - is_active
    - created_at (생성일)
    - updated_at (수정일)
    - deleted_at (삭제일)

  * ONE-TO-ONE
    - USER has one PROFILE
    - USER has one ARTIST

  * ONE-TO-MANY
    - USER has many PROVIDERs
    - USER has many COMMENTs
    - USER has many (article)COMMENTs
    - USER has many (auction)BIDs
    - USER has many FOLLOWs (either followers or following)

  * MANY-TO-MANY
    - USER belongs to many COUPONs
    - USER belongs to many AUCTIONs (alarms)
    - USER belongs to many ARTWORKs (likes)

## PROFILE (사용자정보; entity)
  * ATTRIBUTES
    - id (bigint)
    - bio
    - postal_code
    - address
    - address_detail
    - city
    - state
    - county
    - notify_push
    - notify_kakao
    - notify_email
    - notify_event
    - options (공개설정 관련 JSON)
    - view_count
    - logged_at (로그인 시각)
    - usernamed_at (닉네임갱신 시각)
    - created_at (생성일)
    - updated_at (수정일)
    - user_id (bigint)

  * ONE-TO-ONE
    - PROFILE belongs to a USER

## PROVIDER (쇼셜인증제공업체; entity)
  * ATTRIBUTES
    - id (bigint)
    - provider_name (apple | google | kakao)
    - provider_id (varchar)
    - created_at (생성일)
    - updated_at (수정일)
    - user_id (bigint)

  * MANY-TO-ONE
    - PROVIDER belongs to a USER

## BOOK (아티클묶음; entity)
  * ATTRIBUTES
    - id (bigint)
    - title (제목)
    - summary (간단설명)
    - images (이미지)
    - is_active
    - created_at (생성일)
    - updated_at (수정일)
    - deleted_at (삭제일)

  * MANY-TO-MANY
    - BOOK belongs to many ARTICLES

## ARTICLE (아티클; entity)
  * ATTRIBUTES
    - id (bigint)
    - title (제목)
    - subtitle (부제목)
    - body (설명)
    - images (이미지); detail 페이지에서 사용
    - category (CONTENT | UPCOMING | ORIGINAL | INTERVIEW | REVIEW)
    - comment_count (댓글갯수)
    - is_published
    - created_at (생성일)
    - updated_at (수정일)
    - deleted_at (삭제일)

  * ONE-TO-MANY
    - ARTICLE has many COMMENTs

  * MANY-TO-MANY
    - ARTICLE belongs to many BOOKs
    - ARTICLE belongs to many AUCTIONs

## COMMENT (아티클댓글; entity)
  * ATTRIBUTES
    - id (bigint)
    - body (댓글내용)
    - created_at (생성일)
    - updated_at (수정일)
    - deleted_at (삭제일)
    - user_id (bigint)
    - article_id (bigint)
    - parent_id? (bigint)

  * ONE-TO-MANY
    - COMMENT belongs to a USER
    - COMMENT belongs to an ARTICLE

## ARTIST (작가/갤러리; entity)
  * ATTRIBUTES
    - id (bigint)
    - name
    - nationality
    - artist_note
    - curator_note
    - sns
    - highlight
    - credentials
    - genre (PAINTER, DRAWER, SCULPTOR, PHOTOGRAPHER, visual VISUAL_ARTIST, GALLERY, ETC.)
    - date_of_birth
    - date_of_death
    - note
    - user_id (bigint)

  * ONE-TO-ONE
    - ARTIST belongs to a USER

  * ONE-TO-MANY
    - ARTIST has many ARTWORKs

  * MANY-TO-MANY
    - ARTIST belongs to many PACKs

## ARTWORK (작품; entity)
  * ATTRIBUTES
    - id (bigint)
    - title (작품제목)
    - subtitle (작품부제목)
    - body (작품설명)
    - images (이미지)
    - estimate (추정가)
    - width (in millimeter)
    - height (in millimeter)
    - depth (in millimeter)
    - canvasSize (호수)

    - category ( ACRYLIC_PAINTING | OIL_PAINTING | ... OTHER )
    - availability ( AVAILABLE | SOLD | UNKNOWN )
    - framing ( FRAMED | UNFRAMED )
    - orientation ( LANDSCAPE | PORTRAIT | SQUARE )
    - size (S | M | L | XL)

    - medium (소재)
    - conditions (컨디션 상세)
    - produced_in (생산연도)
    - note

    - view_count (number of views)

    - created_at (생성일)
    - updated_at (수정일)
    - deleted_at (삭제일)

    - artist_id (bigint)

  * ONE-TO-MANY
    - ARTWORK has many AUCTIONs
  
  * MANY-TO-ONE
    - ARTWORK belongs to ARTIST
  
  * MANY-TO-MAMY
    - ARTWORK belongs to many HASHTAGs
    - ARTWORK belongs to many USERs (like)

## HASHTAG (해쉬택; entity)
  * ATTRIBUTES
    - id (bigint)
    - name (제목)
    - slug (slug)
    - created_at (생성일)
    - updated_at (수정일)

  * MANY-TO-MANY
    - ARTWORK belongs to many HASHTAGs

## PACK (옥션묶음; entity)
  * ATTRIBUTES
    - id (bigint)
    - title (제목)
    - summary (간단설명)
    - images (이미지)
    - is_active
    - created_at (생성일)
    - updated_at (수정일)
    - deleted_at (삭제일)

  * MANY-TO-MANY
    - PACK belongs to many ARTISTs
    - PACK belongs to many AUCTIONs

## AUCTION (옥션; entity) ✅
  * ATTRIBUTES
    - id (bigint)
    - title
    - subtitle
    - images
    - start_time (시작시각)
    - end_time (종료시각)
    - closing_time (최종종료시각)
    - bid_extension_time (종료연장시간 default to 10)
    - starting_price (시작가 $)
    - reserve_price (보장가 $)
    - bid_increment (다음호가 증감액 $)
    - delivery_fee (배달비 $)
    - bid_count (입찰수) *need to be updated*
    - current_bid (현재입찰가) *need to be updated*
    - status ( PREPARING | ONGOING | ENDED )
    - note
    - paid_at (지불일)
    - created_at (생성일)
    - updated_at (수정일)
    - deleted_at (삭제일)
    - artwork_id (bigint)

  * MANY-TO-ONE
    - AUCTION belongs to an ARTWORK

  * ONE-TO-MANY
    - AUCTION has many BIDs

  * MANY-TO-MANY
    - AUCTION belongs to many PACKs
    - AUCTION belongs to many USERs (alarms)
    - AUCTION belongs to many ARTICLEs

## BID (입찰; entity) ✅
  * ATTRIBUTES
    - id (bigint)
    - amount (입찰액 $)
    - note
    - created_at (생성일)
    - updated_at (수정일)
    - deleted_at (수정일)
    - user_id (bigint)
    - auction_id (bigint)

  * UNIQUE KEY (auction_bid, amount)

  * MANY-TO-ONE
    - BID belongs to an AUCTION
    - BID belongs to a USER

## COUPON (쿠폰; entity) ✅
  * ATTRIBUTES
    - id (bigint)
    - name (쿠폰명)
    - code (쿠폰코드)
    - discount (쿠폰할인금액)
    - total (최대발행수)
    - count (발행수)
    - expired_at (쿠폰만기일)
    - used_at (쿠폰사용일)
    - created_at (생성일)
    - updated_at (수정일)

  * MANY-TO-MANY
    - COUPON belongs to many USERs

## ORDER
  * ATTRIBUTES
    - id

    - userId (구매자 아이디)
    - couponId (쿠폰 아이디)
    - discount (쿠폰 할인액)

    - itemSubTotal
    - deliverySubTotal
    - total
    - discount
    - grandTotal

    - recipientName (수신자)
    - recipientPhone (수신자연락처)
    - postalCode (우편번호)
    - address (주소)
    - addressDetail (상세주소)
    - city (시/군)
    - state (특별시/광역시/도)
    - county (국가)

    - pgId (PG사 아이디)
    - paymentMethod (결제방법)
    - paymentStatus (결제상태)
    - paymentInfo (가상계좌정보)
    - deliveryRequest
    - created_at (생성일)
    - updated_at (수정일)

  * ONE-TO-MANY
    - ORDER has many ORDER-ITEMs

  * MANY-TO-ONE
    - ORDER belongs to many USERs

## ORDER-ITEM

  * ATTRIBUTES
    - orderId
    - orderType
    - productId
    - auctionId
    - SKU
    - price
    - deliveryFee
    - quantity
    - created_at (생성일)
    - updated_at (수정일)

  * MANY-TO-ONE
    - ORDER-ITEM belongs to ORDER
    - ORDER-ITEM belongs to AUCTION or PRODUCT

# PIVOT TABLEs

## GRANT (coupons/users; pivot) ✅
  * ATTRIBUTES
    - couponId (bigint)
    - userId (bigint)

  * MANY-TO-MANY
    - USER belongs to many COUPONs
    - COUPON belongs to many USERs

## FOLLOW (followers/followings; pivot) ✅
  * ATTRIBUTES
    - followingId (userId; bigint)
    - followerId (userId; bigint)

  * MANY-TO-MANY
    - USER belongs to many following
    - USER belongs to many followers

## ARTICLE_AUCTION (아티클_옥션; pivot) ✅
  * ATTRIBUTES
    - articleId (bigint)
    - auctionId (bigint)

  * MANY-TO-MANY
    - ARTICLE belongs to many AUCTIONs
    - AUCTION belongs to many ARTICLEs

## ARTWORK_USER_LIKE (좋아요; pivot) ✅
  * ATTRIBUTES
    - artworkId (bigint)
    - userId (bigint)

  * MANY-TO-MANY
    - ARTWORK belongs to many USERs
    - USER belongs to many ARTWORKs

## AUCTION_USER_ALARM (옥션알림; pivot) ✅
  * ATTRIBUTES
    - aucionId (bigint)
    - userId (bigint)

  * MANY-TO-MANY
    - AUCTION belongs to many USERs
    - USER belongs to many AUCTIONs

  ```
  옥션 알림을 위한 대상자
    - 옥션 시작전 알람 요청한 사용자
    - 진행중인 옥션 아이템에 좋아요 누른 사용자
    - 진행중인 옥션에 입찰한 사용자
  ```

## BOOK_ARTICLE (큐레이션; pivot) ✅
  * ATTRIBUTES
    - bookId (bigint)
    - articleId (bigint)

  * MANY-TO-MANY
    - ARTICLE belongs to many BOOKs
    - BOOK belongs to many ARTICLEs

## HASHTAG_ARTWORK (작품해쉬택; pivot) ✅
  * ATTRIBUTES
    - hashtagId (bigint)
    - artworkId (bigint)

  * MANY-TO-MANY
    - ARTWORK belongs to many HASHTAGs
    - HASHTAG belongs to many ARTWORKs

## PACK_ARTIST (작품아티클; pivot) ✅
  * ATTRIBUTES
    - packId (bigint)
    - artistId (bigint)

  * MANY-TO-MANY
    - PACK belongs to many ARTISTs
    - ARTIST belongs to many PACKs

## PACK_AUCTIONS (작품그룹핑; pivot) ✅
  * ATTRIBUTES
    - packId (bigint)
    - auctionId (bigint)

  * MANY-TO-MANY
    - PACK belongs to many AUCTIONs
    - AUCTION belongs to many PACKs

----






# 추가 작업이 필요한 테이블들

## TRANSACTION (pivot table)
  * ATTRIBUTES
    - id
    - userId
    - orderId
    - status
    - created_at (생성일)
    - updated_at (수정일)

## CART (카트; entity)
  * ATTRIBUTES
    - id (bigint)
    - userId
    - uuid
    - status (new | cart | checkout | paid | complete | abandoned )

    - recipient (수신자)
    - phone (연락처)
    - address (배송지)
    - city (배송지)
    - county (배송지)

    - created_at (생성일)
    - updated_at (수정일)

  * MANY-TO-MANY
    - CART-ITEM belongs to a PRODUCT
    - CART-ITEM belongs to a CARD

## CART-ITEM (카트아이템; entity)
  * ATTRIBUTES
    - id (bigint)
    - productId
    - cartId
    - 
    - SKU (재고관리UNIT 바코드번호)
    - price (가격)
    - discount (할인)
    - quantity (재고숫자)

    - created_at (생성일)
    - updated_at (수정일)

  * MANY-TO-MANY
    - CART-ITEM belongs to a PRODUCT
    - CART-ITEM belongs to a CARD




































## ARTWORK_PRODUCT
  * ONE-TO-MANY
    - PRODUCT belongs to ARTWORK

## PRODUCT (상품; entity as opposed to ARTWORK)
  * ATTRIBUTES
    - id (bigint)
    - artist_id (bigint)
    - category (작품카테고리) *optional*
    - name (상품명)
    - description (상품설명)
    - images (이미지)
    - videos (비디오)
  
    - SKU (재고관리UNIT 바코드번호)
    - price (가격)
    - discount (할인)
    - quantity (재고숫자)

    - material (작품재질)
    - dimension (크기)
    - condition details (컨디션 상세설명)
    - years (생산연도) *optional*
    - artist_id
    - classification (unique | limited_edition | open_edition | unknown)
    - number of likes
    - number of views
    - created_at (생성일)
    - updated_at (수정일)
    - deleted_at (삭제일)

  * ONE-TO-MANY
    - PRODUCT belongs to an ARTIST
    - ARTIST has many PRODUCTs

  * MANY-TO-MANY
    - PRODUCT belongs to many HASHTAGs

## PRODUCT_HASHTAG (상품해쉬택; pivot)
  * ATTRIBUTES
    - productId (bigint)
    - hashtagId (bigint)

  * MANY-TO-MANY
    - PRODUCT belongs to many HASHTAGs
    - HASHTAG belongs to many PRODUCTs


## ARTICLE_PRODUCT (상품아티클; pivot)
  * ATTRIBUTES
    - articleId (bigint)
    - productId (bigint)

  * MANY-TO-MANY
    - ARTICLE belongs to many PRODUCTs
    - PRODUCT belongs to many ARTICLEs
