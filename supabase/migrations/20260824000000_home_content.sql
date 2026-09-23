-- 카페 홈페이지 콘텐츠 (naraka-home): 공지·이벤트 / 스태프 / 출근표 / 메뉴
-- 쓰기는 전부 서버(서비스 롤, 어드민 API)에서만 — RLS는 공개 읽기 범위만 연다.

create table home_posts (
  id bigint generated always as identity primary key,
  type text not null check (type in ('notice', 'event')),
  title text not null,
  body_md text not null default '',
  cover_image_url text,
  pinned boolean not null default false,
  published boolean not null default true,
  published_at timestamptz not null default now(),
  event_start_date date,
  event_end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- 이벤트 글은 달력 표시를 위해 시작일 필수, 공지는 날짜 없음
  constraint home_posts_event_dates check (type = 'notice' or event_start_date is not null),
  constraint home_posts_date_order check (
    event_end_date is null or event_start_date is null or event_end_date >= event_start_date
  )
);
create index idx_home_posts_list on home_posts (type, pinned desc, published_at desc);
create index idx_home_posts_event_range on home_posts (event_start_date, event_end_date)
  where type = 'event';

create table home_staff (
  id bigint generated always as identity primary key,
  name text not null,
  role text not null default '',
  photo_url text,
  intro text not null default '',
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 출근표 — 하루 안에서도 시간대가 나뉘므로 (날짜, 스태프, 시간대) 단위 행
create table home_schedule (
  id bigint generated always as identity primary key,
  work_date date not null,
  staff_id bigint not null references home_staff (id) on delete cascade,
  start_min int not null check (start_min >= 0 and start_min < 1440),
  end_min int not null check (end_min > 0 and end_min <= 1440),
  created_at timestamptz not null default now(),
  constraint home_schedule_time_order check (end_min > start_min)
);
create index idx_home_schedule_date on home_schedule (work_date);

create table home_menu_items (
  id bigint generated always as identity primary key,
  category text not null,
  name text not null,
  price int not null check (price >= 0),
  description text not null default '',
  image_url text,
  sort_order int not null default 0,
  is_sold_out boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_home_menu_list on home_menu_items (category, sort_order);

alter table home_posts enable row level security;
alter table home_staff enable row level security;
alter table home_schedule enable row level security;
alter table home_menu_items enable row level security;

-- 공개 읽기 (서비스 롤은 RLS 우회하므로 쓰기 정책 불필요)
create policy home_posts_public_read on home_posts for select using (published = true);
create policy home_staff_public_read on home_staff for select using (is_active = true);
create policy home_schedule_public_read on home_schedule for select using (true);
create policy home_menu_public_read on home_menu_items for select using (true);

-- 홈 이미지 업로드용 공개 버킷 (공개 URL 읽기, 업로드는 어드민 API의 서비스 롤만)
insert into storage.buckets (id, name, public)
values ('home-assets', 'home-assets', true)
on conflict (id) do nothing;
